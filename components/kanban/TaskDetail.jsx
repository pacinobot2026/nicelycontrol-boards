import { useState } from 'react';
import { COLUMNS, PROJECTS } from './constants';

export default function TaskDetail({ task, isOpen, onClose, onSave, onDelete, onArchive, teamMembers = [] }) {
  const [activeTab, setActiveTab] = useState('details');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Med');
  const [status, setStatus] = useState('inbox');
  const [project, setProject] = useState('');
  const [assignee, setAssignee] = useState('');
  const [progress, setProgress] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Load task data when opened
  if (task && isOpen && title !== task.title) {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setStatus(task.status);
    setProject(task.project);
    setAssignee(task.assignee || '');
    setProgress(task.progress || 0);
    setDueDate(task.dueDate || '');
  }

  if (!isOpen || !task) return null;

  const handleSave = () => {
    onSave({
      ...task,
      title,
      description,
      priority,
      status,
      project,
      assignee: assignee || undefined,
      progress,
      dueDate: dueDate || undefined,
    });
  };

  // Handle subtasks
  const parsedSubtasks = (() => {
    if (!task.subtasks) return [];
    if (Array.isArray(task.subtasks)) return task.subtasks;
    if (typeof task.subtasks === 'string') {
      try {
        const parsed = JSON.parse(task.subtasks);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  const completedSubtasks = parsedSubtasks.filter(s => s.completed).length;
  const totalSubtasks = parsedSubtasks.length;

  const toggleSubtask = (subtaskId) => {
    const updatedSubtasks = parsedSubtasks.map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onSave({ ...task, subtasks: updatedSubtasks });
  };

  const addSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSubtask = {
      id: Date.now().toString(),
      text: newSubtaskText,
      completed: false
    };
    onSave({ ...task, subtasks: [...parsedSubtasks, newSubtask] });
    setNewSubtaskText('');
  };

  const tabs = [
    { id: 'details', label: 'Task Details' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'images', label: 'Images' },
    { id: 'comments', label: 'Comments' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Slide-out Panel from LEFT */}
      <div className="fixed inset-y-0 left-0 w-[420px] z-50 bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-base font-medium bg-gray-800/50 border-none text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Task title..."
              />
            </div>
            <button
              onClick={onClose}
              className="ml-3 p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs text-gray-400 font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-white border-purple-500 font-medium'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Add a description..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-800 text-sm text-white rounded-lg px-3 py-2.5 border border-gray-700 focus:outline-none focus:border-purple-500"
                >
                  {COLUMNS.map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>

              {/* Project */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Project</label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full bg-gray-800 text-sm text-white rounded-lg px-3 py-2.5 border border-gray-700 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select...</option>
                  {PROJECTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Assignee</label>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full bg-gray-800 text-sm text-white rounded-lg px-3 py-2.5 border border-gray-700 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-gray-800 text-sm text-white rounded-lg px-3 py-2.5 border border-gray-700 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">Checklist Items</h3>
                <span className="text-xs text-gray-500">{completedSubtasks}/{totalSubtasks}</span>
              </div>

              {totalSubtasks > 0 && (
                <div className="space-y-2 mb-4">
                  {parsedSubtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg group hover:bg-gray-800 transition-colors">
                      <button
                        className="text-lg hover:scale-110 transition-transform mt-0.5"
                        onClick={() => toggleSubtask(subtask.id)}
                      >
                        {subtask.completed ? '✅' : '☐'}
                      </button>
                      <span className={`text-sm flex-1 ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                        {subtask.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {totalSubtasks === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">☐</span>
                  </div>
                  <p className="text-sm">No checklist items yet</p>
                </div>
              )}

              {/* Add Subtask Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="Add a checklist item..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={addSubtask}
                  disabled={!newSubtaskText.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              {task.images && task.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {task.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group">
                      <img
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => window.open(img, '_blank')}
                          className="px-3 py-1.5 bg-white text-gray-900 rounded text-sm font-medium"
                        >
                          View Full
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">No images attached</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p>No comments yet</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Save Button */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                if (onArchive) onArchive(task.id);
                onClose();
              }}
              className="p-2.5 bg-gray-800 text-yellow-400 rounded-lg hover:bg-gray-700 transition-colors"
              title="Archive"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (onDelete) onDelete(task.id);
                onClose();
              }}
              className="p-2.5 bg-gray-800 text-red-400 rounded-lg hover:bg-gray-700 transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
