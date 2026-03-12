import { useMemo } from 'react';
import { PROJECTS } from './constants';

export default function ActivityFeed({ tasks, teamMembers = [] }) {
  const activities = useMemo(() => {
    const acts = [];

    tasks.forEach(task => {
      const project = PROJECTS.find(p => p.id === task.project);
      const assignee = task.assignee ? teamMembers.find(m => m.id === task.assignee) : null;

      // Task created
      acts.push({
        id: `${task.id}-created`,
        type: 'created',
        task,
        timestamp: task.createdAt,
        message: `${task.title}`,
        actor: 'System',
        icon: '➕',
        color: 'text-blue-400',
      });

      // Status label changes
      if (task.statusLabel === 'DELAYED') {
        acts.push({
          id: `${task.id}-delayed`,
          type: 'delayed',
          task,
          timestamp: task.updatedAt,
          message: `${task.title} marked as DELAYED`,
          actor: assignee?.name || 'System',
          icon: '⏰',
          color: 'text-purple-400',
        });
      }

      if (task.statusLabel === 'CRITICAL') {
        acts.push({
          id: `${task.id}-critical`,
          type: 'critical',
          task,
          timestamp: task.updatedAt,
          message: `${task.title} flagged CRITICAL`,
          actor: assignee?.name || 'Chad',
          icon: '🔴',
          color: 'text-red-400',
        });
      }

      // Assignment
      if (task.assignee) {
        acts.push({
          id: `${task.id}-assigned`,
          type: 'assigned',
          task,
          timestamp: task.updatedAt,
          message: `${task.title} assigned to ${assignee?.name}`,
          actor: 'Chad',
          icon: '👤',
          color: 'text-teal-400',
        });
      }

      // Progress updates
      if (task.progress && task.progress > 0 && task.progress < 100) {
        acts.push({
          id: `${task.id}-progress`,
          type: 'progress',
          task,
          timestamp: task.updatedAt,
          message: `${assignee?.name || 'Team'} updated ${task.title} progress to ${task.progress}%`,
          actor: assignee?.name || 'Team',
          icon: '📊',
          color: 'text-yellow-400',
        });
      }

      // Status moves
      if (task.status === 'in-progress') {
        acts.push({
          id: `${task.id}-started`,
          type: 'moved',
          task,
          timestamp: task.updatedAt,
          message: `${assignee?.name || 'Team'} started work on ${task.title}`,
          actor: assignee?.name || 'Team',
          icon: '🚀',
          color: 'text-purple-400',
        });
      }

      if (task.status === 'review') {
        acts.push({
          id: `${task.id}-review`,
          type: 'moved',
          task,
          timestamp: task.updatedAt,
          message: `${task.title} moved to Review`,
          actor: assignee?.name || 'Team',
          icon: '👁️',
          color: 'text-teal-400',
        });
      }

      // Completed
      if (task.status === 'done') {
        acts.push({
          id: `${task.id}-completed`,
          type: 'completed',
          task,
          timestamp: task.updatedAt,
          message: `${assignee?.name || 'Team'} completed ${task.title}`,
          actor: assignee?.name || 'Team',
          icon: '✅',
          color: 'text-green-400',
        });
      }
    });

    // Sort by most recent
    return acts.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 15); // Show last 15 activities
  }, [tasks, teamMembers]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const getProjectEmoji = (task) => {
    const project = PROJECTS.find(p => p.id === task.project);
    return project?.icon || '📋';
  };

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex-shrink-0">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          🔔 Activity
        </h2>
        <p className="text-xs text-gray-500 mt-1">Recent updates</p>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-2">Create tasks to see updates here</p>
          </div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="group hover:bg-gray-800/50 rounded-lg p-3 transition-all cursor-pointer">
              <div className="flex gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-base ${activity.color} group-hover:scale-110 transition-transform`}>
                  {activity.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 leading-snug mb-1">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">{formatTime(activity.timestamp)}</span>
                    <span className="text-gray-700">•</span>
                    <span className="text-gray-600">{getProjectEmoji(activity.task)}</span>
                    {activity.actor && (
                      <>
                        <span className="text-gray-700">•</span>
                        <span className="text-gray-500">{activity.actor}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-800 space-y-3 flex-shrink-0">
        <div className="text-xs font-medium text-gray-400 mb-2">📊 This Week</div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Completed</span>
            <span className="text-green-400 font-medium">
              {tasks.filter(t => t.status === 'done').length}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">In Progress</span>
            <span className="text-purple-400 font-medium">
              {tasks.filter(t => t.status === 'in-progress').length}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Delayed</span>
            <span className="text-yellow-400 font-medium">
              {tasks.filter(t => t.statusLabel === 'DELAYED').length}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Critical</span>
            <span className="text-red-400 font-medium">
              {tasks.filter(t => t.statusLabel === 'CRITICAL').length}
            </span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="pt-3 border-t border-gray-800">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Completion Rate</span>
            <span className="text-gray-300 font-medium">
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
