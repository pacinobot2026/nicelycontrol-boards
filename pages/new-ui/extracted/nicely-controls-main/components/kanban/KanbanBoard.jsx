import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { COLUMNS, PROJECTS, TEAM_MEMBERS } from './constants';
import Column from './Column';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskDetail from './TaskDetail';
import ProjectSidebar from './ProjectSidebar';
import ActivityFeed from './ActivityFeed';
import ListView from './ListView';

export default function KanbanBoard({ session }) {
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [showProjectSidebar, setShowProjectSidebar] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [showMobileActivity, setShowMobileActivity] = useState(false);
  const [viewMode, setViewMode] = useState('board');
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [initialStatus, setInitialStatus] = useState(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (session?.access_token || ''),
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/kanban/tasks', {
        headers: { 'Authorization': 'Bearer ' + (session?.access_token || '') },
      });
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id;

    // Check if dropping on a column
    const isColumn = COLUMNS.some(col => col.id === overId);
    if (isColumn) {
      const newStatus = overId;
      if (activeTask.status !== newStatus) {
        setTasks(prev =>
          prev.map(t =>
            t.id === activeTask.id ? { ...t, status: newStatus } : t
          )
        );
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Check if dragging over another task (reordering)
    const isOverTask = tasks.some(t => t.id === overId);

    if (isOverTask && activeId !== overId) {
      const activeTask = tasks.find(t => t.id === activeId);
      const overTask = tasks.find(t => t.id === overId);

      if (activeTask && overTask) {
        // Get tasks in the same column
        const columnTasks = tasks.filter(t => t.status === activeTask.status);
        const activeIndex = columnTasks.findIndex(t => t.id === activeId);
        const overIndex = columnTasks.findIndex(t => t.id === overId);

        // Reorder within the column
        const reorderedColumnTasks = arrayMove(columnTasks, activeIndex, overIndex);

        // Update full tasks array preserving other columns
        const otherTasks = tasks.filter(t => t.status !== activeTask.status);
        const newTasks = [...otherTasks, ...reorderedColumnTasks];

        setTasks(newTasks);

        // Save to database
        try {
          await fetch('/api/kanban/tasks', {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({ ...activeTask, status: overTask.status }),
          });
        } catch (error) {
          console.error('Failed to reorder task:', error);
          fetchTasks();
        }
      }
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) {
        // Update existing task
        const existingTask = tasks.find(t => t.id === taskData.id);
        const fullTask = { ...existingTask, ...taskData };
        await fetch('/api/kanban/tasks', {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(fullTask),
        });
      } else {
        // Create new task
        await fetch('/api/kanban/tasks', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(taskData),
        });
      }
      fetchTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleNewTask = (status) => {
    setEditingTask(null);
    setInitialStatus(status || null);
    setIsModalOpen(true);
  };

  const handleToggleSubtask = async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const updatedTask = { ...task, subtasks: updatedSubtasks };

    try {
      await fetch('/api/kanban/tasks', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(updatedTask),
      });
      fetchTasks();
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await fetch(`/api/kanban/tasks?id=${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + (session?.access_token || '') },
      });
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleArchiveTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, archived: true };

    try {
      await fetch('/api/kanban/tasks', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(updatedTask),
      });
      fetchTasks();
    } catch (error) {
      console.error('Failed to archive task:', error);
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProject(projectId);
    setShowProjectSidebar(false); // Close on mobile after selection
  };

  const filteredTasks = tasks.filter(t => {
    const projectMatch = selectedProject ? t.project === selectedProject : true;
    const typeMatch = typeFilter === 'all' ? true : t.type === typeFilter;
    const assigneeMatch = selectedAssignee ? t.assignee === selectedAssignee : true;
    const notArchived = !t.archived;
    return projectMatch && typeMatch && assigneeMatch && notArchived;
  });

  const getTasksByStatus = (status) => {
    return filteredTasks.filter(t => t.status === status);
  };

  const projectCounts = PROJECTS.map(project => ({
    ...project,
    count: tasks.filter(t => t.project === project.id).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-950 overflow-hidden">
      {/* Left Sidebar - Projects */}
      <div className="hidden lg:block">
        <ProjectSidebar
          projects={projectCounts}
          selectedProject={selectedProject}
          onSelectProject={handleSelectProject}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/50 px-4 lg:px-6 py-3 md:py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Left: Search Bar - Responsive width */}
            <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-[120px] md:max-w-none">
              <div className="relative w-full md:w-64">
                <svg className="w-4 h-4 md:w-5 md:h-5 absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-8 md:pl-10 pr-2 md:pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full text-sm"
                />
              </div>

              {/* Date Created filter - Desktop only */}
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-400">
                <span>Date Created</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Center: Staff Names (like "Jarvis" style) */}
            <div className="hidden lg:flex items-center gap-6">
              {TEAM_MEMBERS.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedAssignee(selectedAssignee === member.name ? null : member.name)}
                  className={`flex items-center gap-2 transition-colors group ${
                    selectedAssignee === member.name
                      ? 'text-purple-400'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-medium">{member.name}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    selectedAssignee === member.name ? 'bg-purple-500' : 'bg-green-500'
                  }`}></div>
                </button>
              ))}
              {selectedAssignee && (
                <button
                  onClick={() => setSelectedAssignee(null)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Right: View Toggle, Bell, Add Task */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* View Toggle - Always visible, compact on mobile */}
              <div className="flex items-center bg-gray-800 rounded-lg p-0.5 md:p-1">
                <button
                  onClick={() => setViewMode('board')}
                  className={`p-1.5 md:p-2 rounded transition-colors ${
                    viewMode === 'board'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Board View"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 md:p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Bell button - hidden on mobile, show on md+ */}
              <button
                onClick={() => setShowMobileActivity(true)}
                className="hidden md:block p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {tasks.filter(t => t.status === 'in-progress').length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
                )}
              </button>

              {/* Add Task button - compact on mobile */}
              <button
                onClick={() => handleNewTask()}
                className="p-2 md:px-4 md:py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-1 md:gap-2 shadow-lg"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden md:inline text-sm">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Board or List View */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'board' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="h-full overflow-x-auto overflow-y-hidden">
                <div className="flex gap-3 lg:gap-4 p-4 lg:p-6 min-w-max h-full">
                  {COLUMNS.map(column => (
                    <Column
                      key={column.id}
                      id={column.id}
                      title={column.title}
                      tasks={getTasksByStatus(column.id)}
                      onEditTask={handleEditTask}
                      onToggleSubtask={handleToggleSubtask}
                      onDeleteTask={handleDeleteTask}
                      onArchiveTask={handleArchiveTask}
                      onAddTask={(status) => handleNewTask(status)}
                    />
                  ))}
                </div>
              </div>

              <DragOverlay>
                {activeTask && (
                  <TaskCard task={activeTask} onEdit={() => {}} onToggleSubtask={handleToggleSubtask} />
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="h-full overflow-auto p-4 lg:p-6">
              <ListView
                tasks={filteredTasks}
                onEditTask={handleEditTask}
                onToggleSubtask={handleToggleSubtask}
                onDeleteTask={handleDeleteTask}
                onArchiveTask={handleArchiveTask}
                onAddTask={(status) => handleNewTask(status)}
                onReorderTasks={(newTasks) => setTasks(newTasks)}
                onUpdateTask={async (taskId, updates) => {
                  console.log('KanbanBoard onUpdateTask called:', taskId, updates);

                  const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
                  setTasks(updatedTasks);

                  console.log('Updated tasks count:', updatedTasks.length);

                  // Save to API
                  try {
                    const response = await fetch('/api/kanban/tasks', {
                      method: 'POST',
                      headers: authHeaders,
                      body: JSON.stringify({ action: 'updateAll', tasks: updatedTasks }),
                    });

                    const result = await response.json();
                    console.log('API save result:', result);
                  } catch (error) {
                    console.error('Failed to save tasks:', error);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed Slide-out Panel (Desktop & Mobile) */}
      {showMobileActivity && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileActivity(false)}
          />
          <div className="fixed inset-y-0 right-0 w-80 z-50 transform transition-transform">
            <div className="h-full bg-gray-900 border-l border-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">🔔 Activity</h2>
                <button
                  onClick={() => setShowMobileActivity(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ActivityFeed tasks={tasks} />
              </div>
            </div>
          </div>
        </>
      )}

      <TaskModal
        task={editingTask}
        initialStatus={initialStatus}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setInitialStatus(null);
        }}
        onSave={handleSaveTask}
      />

      <TaskDetail
        task={selectedTask}
        isOpen={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onArchive={handleArchiveTask}
      />
    </div>
  );
}
