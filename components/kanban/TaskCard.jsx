import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { STATUS_LABEL_COLORS, PRIORITY_COLORS } from './constants';

export default function TaskCard({ task, teamMembers = [], onEdit, onToggleSubtask, onDelete, onArchive }) {
  const [showMenu, setShowMenu] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const assignee = task.assignee ? teamMembers.find(m => m.id === task.assignee) : null;

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  // Auto-calculate progress from subtasks if they exist and no manual progress set
  const displayProgress = task.subtasks && task.subtasks.length > 0
    ? Math.round((completedSubtasks / totalSubtasks) * 100)
    : task.progress;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 cursor-grab active:cursor-grabbing hover:bg-gray-800 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
      onClick={() => onEdit(task)}
    >
      {/* Header with badges and menu */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {task.statusLabel && (
            <span className={`text-xs px-2 py-1 rounded-md font-medium ${STATUS_LABEL_COLORS[task.statusLabel]}`}>
              {task.statusLabel}
            </span>
          )}
          {/* Priority Badge */}
          <span className={`text-xs px-2 py-1 rounded-md font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </span>
        </div>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
            </svg>
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onArchive && onArchive(task.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-gray-700 hover:text-yellow-300 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Archive
                </button>
                <div className="border-t border-gray-700 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete && onDelete(task.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-100 text-sm leading-snug mb-2 group-hover:text-white transition-colors">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtasks with clickable checkboxes */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {task.subtasks.slice(0, 3).map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-start gap-2 text-xs cursor-pointer hover:bg-gray-700/50 rounded px-1 py-0.5 -mx-1"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSubtask && onToggleSubtask(task.id, subtask.id);
              }}
            >
              <span className={subtask.completed ? 'text-green-400' : 'text-gray-600'}>
                {subtask.completed ? '✅' : '☐'}
              </span>
              <span className={`flex-1 ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                {subtask.text}
              </span>
            </div>
          ))}
          {totalSubtasks > 3 && (
            <div className="text-xs text-gray-500 pl-5">
              +{totalSubtasks - 3} more
            </div>
          )}
          <div className="text-xs text-gray-400 font-medium pl-5 mt-2">
            {completedSubtasks}/{totalSubtasks} completed
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {(displayProgress !== undefined && displayProgress !== null) && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span className={displayProgress === 100 ? 'text-green-400' : ''}>{displayProgress}%</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                displayProgress === 100
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500'
              }`}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.map(tag => (
            <span key={tag} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
        {/* Assignee */}
        {assignee && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">
              {assignee.avatar}
            </div>
            <span className="text-xs text-gray-400">{assignee.name}</span>
          </div>
        )}
        {!assignee && <div />}

        {/* Dates & Drag Handle */}
        <div className="flex items-center gap-3">
          {/* Date Created */}
          {task.createdAt && (
            <span className="text-xs text-gray-500" title="Created">
              📝 {formatDate(task.createdAt)}
            </span>
          )}
          {/* Due Date */}
          {task.dueDate && (
            <span className="text-xs text-gray-500" title="Due">
              📅 {formatDate(task.dueDate)}
            </span>
          )}
          {/* Drag Handle */}
          <div
            className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 p-1"
            title="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
