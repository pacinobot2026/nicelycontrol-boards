import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const COLUMN_STYLES = {
  'inbox': { bg: 'bg-gray-800/80', border: 'border-gray-700', badge: 'bg-gray-600 text-gray-200', icon: '📥' },
  'assigned': { bg: 'bg-blue-900/20', border: 'border-blue-500/30', badge: 'bg-blue-600 text-blue-100', icon: '👤' },
  'in-progress': { bg: 'bg-purple-900/20', border: 'border-purple-500/30', badge: 'bg-purple-600 text-purple-100', icon: '🚧' },
  'review': { bg: 'bg-teal-900/20', border: 'border-teal-500/30', badge: 'bg-teal-600 text-teal-100', icon: '👁️' },
  'done': { bg: 'bg-green-900/20', border: 'border-green-500/30', badge: 'bg-green-600 text-green-100', icon: '✅' },
};

export default function Column({ id, title, tasks, onEditTask, onToggleSubtask, onDeleteTask, onArchiveTask, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const style = COLUMN_STYLES[id];

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 sm:w-80 lg:w-[340px] ${style.bg} backdrop-blur-sm rounded-xl border-2 ${style.border} ${
        isOver ? 'ring-2 ring-purple-500 ring-opacity-50 shadow-lg shadow-purple-500/20' : ''
      } transition-all flex flex-col`}
    >
      <div className="p-3 lg:p-4 border-b border-gray-700/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-100 flex items-center gap-2 text-sm lg:text-base">
            <span className="text-base lg:text-lg">{style.icon}</span>
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 lg:px-2.5 py-1 rounded-full ${style.badge}`}>
              {tasks.length}
            </span>
            <button
              onClick={() => onAddTask && onAddTask(id)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Add Task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-2 lg:p-3 space-y-2 lg:space-y-3 overflow-y-auto flex-1 custom-scrollbar">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} onToggleSubtask={onToggleSubtask} onDelete={onDeleteTask} onArchive={onArchiveTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8 lg:py-12 text-gray-600 text-sm">
            <div className="text-3xl lg:text-4xl mb-2 opacity-20">{style.icon}</div>
            <div>Drop tasks here</div>
          </div>
        )}
      </div>
    </div>
  );
}
