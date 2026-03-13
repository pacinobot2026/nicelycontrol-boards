import { useState } from 'react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { COLUMNS, TEAM_MEMBERS } from './constants';
import ImageUploadModal from './ImageUploadModal';

const PRIORITY_COLORS = {
  'Low': 'bg-gray-600',
  'Med': 'bg-yellow-600',
  'High': 'bg-red-600',
};

const STATUS_BG_COLORS = {
  'inbox': 'bg-gray-700/50',
  'assigned': 'bg-blue-900/20',
  'in-progress': 'bg-purple-900/20',
  'review': 'bg-teal-900/20',
  'done': 'bg-green-900/20',
};

const STATUS_ICONS = {
  'inbox': '📥',
  'assigned': '👤',
  'in-progress': '🚧',
  'review': '👁️',
  'done': '✅',
};

export default function ListView({ tasks, onEditTask, onToggleSubtask, onDeleteTask, onArchiveTask, onAddTask, onReorderTasks, onUpdateTask }) {
  const [expandedSections, setExpandedSections] = useState({
    'inbox': true,
    'assigned': true,
    'in-progress': true,
    'review': true,
    'done': false,
  });

  const [columnOrder, setColumnOrder] = useState(COLUMNS);

  // Image upload modal state
  const [imageUploadTask, setImageUploadTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getAssignee = (assigneeId) => {
    if (!assigneeId) return null;
    return TEAM_MEMBERS.find(m => m.id === assigneeId);
  };

  const toggleSection = (status) => {
    setExpandedSections(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Check if dragging a column (section)
    const isColumn = columnOrder.some(c => c.id === activeId);
    if (isColumn && activeId !== overId) {
      const oldIndex = columnOrder.findIndex(c => c.id === activeId);
      const newIndex = columnOrder.findIndex(c => c.id === overId);
      setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
      return;
    }

    // Check if dragging a task
    const isTask = tasks.some(t => t.id === activeId);
    if (isTask && activeId !== overId && onReorderTasks) {
      const activeTask = tasks.find(t => t.id === activeId);
      const overTask = tasks.find(t => t.id === overId);

      if (activeTask && overTask && activeTask.status === overTask.status) {
        // Reorder within same status
        const columnTasks = tasks.filter(t => t.status === activeTask.status);
        const oldIndex = columnTasks.findIndex(t => t.id === activeId);
        const newIndex = columnTasks.findIndex(t => t.id === overId);

        const reorderedColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);
        const otherTasks = tasks.filter(t => t.status !== activeTask.status);
        onReorderTasks([...otherTasks, ...reorderedColumnTasks]);
      }
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No tasks found
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={columnOrder.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 pb-8">
          {columnOrder.map((column) => {
            const sectionTasks = getTasksByStatus(column.id);
            const isExpanded = expandedSections[column.id];

            return (
              <SortableSection
                key={column.id}
                column={column}
                isExpanded={isExpanded}
                onToggle={() => toggleSection(column.id)}
                taskCount={sectionTasks.length}
                onAddTask={() => onAddTask && onAddTask(column.id)}
              >
                {isExpanded && sectionTasks.length > 0 && (
                  <div>
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-800/50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-700">
                      <div className="col-span-2">Assigned</div>
                      <div className="col-span-3">Description</div>
                      <div className="col-span-1">Created</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-2">Due Date</div>
                      <div className="col-span-1 text-center">Images</div>
                      <div className="col-span-1 text-center">Comments</div>
                      <div className="col-span-1">Progress</div>
                    </div>

                    <SortableContext items={sectionTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {sectionTasks.map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          onEdit={() => onEditTask(task)}
                          onToggleSubtask={() => onToggleSubtask && onToggleSubtask(task.id, task.subtasks?.[0]?.id || '')}
                          onArchive={() => onArchiveTask && onArchiveTask(task.id)}
                          onAddImage={() => setImageUploadTask(task)}
                          formatDate={formatDate}
                          getAssignee={getAssignee}
                        />
                      ))}
                    </SortableContext>
                  </div>
                )}

                {isExpanded && sectionTasks.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-600 italic bg-gray-900/30">
                    No tasks
                  </div>
                )}
              </SortableSection>
            );
          })}
        </div>
      </SortableContext>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={!!imageUploadTask}
        onClose={() => setImageUploadTask(null)}
        taskTitle={imageUploadTask?.title || ''}
        onUpload={(imageUrl) => {
          if (imageUploadTask && onUpdateTask) {
            // Find the latest version of the task from props
            const latestTask = tasks.find(t => t.id === imageUploadTask.id);
            const currentImages = latestTask?.images || [];

            console.log('Adding image to task:', imageUploadTask.id);
            console.log('Current images:', currentImages);
            console.log('New image URL length:', imageUrl.length);

            onUpdateTask(imageUploadTask.id, {
              images: [...currentImages, imageUrl]
            });
          }
          setImageUploadTask(null);
        }}
      />
    </DndContext>
  );
}

function SortableSection({ column, children, isExpanded, onToggle, taskCount, onAddTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg overflow-hidden">
      {/* Section Header Bar */}
      <div className={`px-4 py-2.5 flex items-center justify-between ${STATUS_BG_COLORS[column.id]}`}>
        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
        >
          <span>{STATUS_ICONS[column.id]}</span>
          <span className="font-medium text-gray-200">{column.title}</span>
          <span className="text-sm text-gray-500">({taskCount})</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddTask}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Add Task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {/* Drag Handle for Section */}
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing"
            title="Drag to reorder section"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function SortableTask({ task, onEdit, onToggleSubtask, onArchive, onAddImage, formatDate, getAssignee }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignee = getAssignee(task.assignee);
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0
    ? Math.round((completedSubtasks / totalSubtasks) * 100)
    : task.progress || 0;

  const commentCount = 0; // Comments not in Task type yet
  const imageCount = task.images?.length || 0;
  const hasImages = imageCount > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors items-center cursor-pointer group"
      onClick={onEdit}
    >
      {/* Drag Handle */}
      <div className="absolute left-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
        </button>
      </div>

      {/* Assigned */}
      <div className="col-span-2 flex items-center gap-2">
        {assignee ? (
          <>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">
              {assignee.avatar}
            </div>
            <span className="text-sm text-gray-300 truncate">{assignee.name}</span>
          </>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>

      {/* Description (Title + short desc) */}
      <div className="col-span-3 min-w-0">
        <p className="text-sm text-gray-200 truncate font-medium">{task.title}</p>
        {task.description && (
          <p className="text-xs text-gray-500 truncate">{task.description}</p>
        )}
      </div>

      {/* Date Created */}
      <div className="col-span-1 text-sm text-gray-500">
        {formatDate(task.createdAt || new Date().toISOString())}
      </div>

      {/* Status */}
      <div className="col-span-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]} text-white`}>
          {task.priority}
        </span>
      </div>

      {/* Date Due */}
      <div className="col-span-2 text-sm text-gray-500">
        {task.dueDate ? formatDate(task.dueDate) : '—'}
      </div>

      {/* Images */}
      <div className="col-span-1 text-center flex items-center justify-center gap-1">
        {hasImages && task.images?.slice(0, 2).map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt=""
            className="w-6 h-6 rounded object-cover border border-gray-700"
          />
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onAddImage) onAddImage();
          }}
          className="w-6 h-6 rounded bg-gray-700 hover:bg-purple-600 text-gray-400 hover:text-white flex items-center justify-center text-xs transition-colors"
          title="Add image"
        >
          +
        </button>
      </div>

      {/* Comments */}
      <div className="col-span-1 text-center">
        {commentCount > 0 ? (
          <span className="text-sm text-blue-400">💬 {commentCount}</span>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>

      {/* Progress */}
      <div className="col-span-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-8">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
