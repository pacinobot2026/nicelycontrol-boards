import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import NavigationSidebar from '../components/NavigationSidebar';
import withAuth from '../lib/withAuth';
import { useAuth } from '../lib/authContext';
import Column from '../components/kanban/Column';
import TaskCard from '../components/kanban/TaskCard';
import TaskModal from '../components/kanban/TaskModal';
import TaskDetail from '../components/kanban/TaskDetail';
import ProjectSidebar from '../components/kanban/ProjectSidebar';
import ActivityFeed from '../components/kanban/ActivityFeed';
import ListView from '../components/kanban/ListView';

const COLUMNS = [
  { id: 'inbox',       title: 'Inbox' },
  { id: 'assigned',   title: 'Assigned' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review',     title: 'Review' },
  { id: 'done',       title: 'Done' },
];

// team API status uses underscores; kanban UI uses hyphens
function teamStatusToKanban(s) {
  return s === 'in_progress' ? 'in-progress' : (s || 'inbox');
}
function kanbanStatusToTeam(s) {
  return s === 'in-progress' ? 'in_progress' : (s || 'inbox');
}

const PRIORITY_UP = { high: 'High', medium: 'Med', low: 'Low' };
const PRIORITY_DOWN = { High: 'high', Med: 'medium', Low: 'low' };

function toKanban(t) {
  return {
    id: String(t.id),
    title: t.title,
    description: t.description || '',
    status: teamStatusToKanban(t.status),
    priority: PRIORITY_UP[t.priority] || 'Med',
    assignee: t.assignee || '',
    tags: Array.isArray(t.tags) ? t.tags : [],
    progress: t.progress || 0,
    project: t.project_id ? String(t.project_id) : '',
    dueDate: t.due_date || '',
    createdAt: t.created_at || new Date().toISOString(),
    subtasks: [],
    archived: false,
  };
}

function toTeamBody(task) {
  return {
    title: task.title,
    description: task.description || '',
    status: kanbanStatusToTeam(task.status),
    priority: PRIORITY_DOWN[task.priority] || 'medium',
    assignee: task.assignee || '',
    tags: task.tags || [],
    progress: task.progress || 0,
    project_id: task.project ? parseInt(task.project) || null : null,
    due_date: task.dueDate || null,
  };
}

export function TeamBoard() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [viewMode, setViewMode] = useState('board');
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [initialStatus, setInitialStatus] = useState(null);
  const [showMobileActivity, setShowMobileActivity] = useState(false);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('👤');
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const token = session?.access_token || '';
  const authHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!token) return;
    fetchTasks();
    fetchProjects();
    fetchTeamMembers();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/team/tasks', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setTasks((data.tasks || []).map(toKanban));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/team/projects', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) { console.error(err); }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/kanban/team-members', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (Array.isArray(data)) setTeamMembers(data);
    } catch (err) { console.error(err); }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    await fetch('/api/kanban/team-members', {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ name: newMemberName.trim(), avatar: newMemberAvatar }),
    });
    setNewMemberName(''); setNewMemberAvatar('👤');
    fetchTeamMembers();
  };

  const handleDeleteMember = async (id) => {
    await fetch(`/api/kanban/team-members?id=${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    fetchTeamMembers();
  };

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handleDragStart = (event) => {
    setActiveTask(tasks.find(t => t.id === event.active.id) || null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;
    const isColumn = COLUMNS.some(c => c.id === over.id);
    if (isColumn && draggedTask.status !== over.id) {
      setTasks(prev => prev.map(t => t.id === draggedTask.id ? { ...t, status: over.id } : t));
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const isOverTask = tasks.some(t => t.id === over.id);
    if (isOverTask && active.id !== over.id) {
      const at = tasks.find(t => t.id === active.id);
      const ot = tasks.find(t => t.id === over.id);
      if (at && ot) {
        const col = tasks.filter(t => t.status === at.status);
        const reordered = arrayMove(col, col.findIndex(t => t.id === active.id), col.findIndex(t => t.id === over.id));
        setTasks([...tasks.filter(t => t.status !== at.status), ...reordered]);
      }
    }

    const moved = tasks.find(t => t.id === active.id);
    if (moved) {
      try {
        await fetch('/api/team/tasks', {
          method: 'PUT', headers: authHeaders,
          body: JSON.stringify({ id: parseInt(active.id), ...toTeamBody(moved) }),
        });
      } catch { fetchTasks(); }
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) {
        const res = await fetch('/api/team/tasks', {
          method: 'PUT', headers: authHeaders,
          body: JSON.stringify({ id: parseInt(taskData.id), ...toTeamBody(taskData) }),
        });
        const data = await res.json();
        if (data.task) setTasks(prev => prev.map(t => t.id === taskData.id ? toKanban(data.task) : t));
      } else {
        const res = await fetch('/api/team/tasks', {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify(toTeamBody(taskData)),
        });
        const data = await res.json();
        if (data.task) setTasks(prev => [...prev, toKanban(data.task)]);
      }
      setIsModalOpen(false);
      setShowTaskDetail(false);
      fetchProjects();
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch('/api/team/tasks', {
        method: 'DELETE', headers: authHeaders,
        body: JSON.stringify({ id: parseInt(taskId) }),
      });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      fetchProjects();
    } catch (err) { console.error(err); }
  };

  const handleArchiveTask = (taskId) => setTasks(prev => prev.filter(t => t.id !== taskId));

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch('/api/team/projects', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      const data = await res.json();
      if (data.project) setProjects(prev => [...prev, data.project]);
      setNewProjectName('');
      setShowAddProject(false);
    } catch (err) { console.error(err); }
  };
  const handleToggleSubtask = () => {};

  const openNewTask = (status) => { setEditingTask(null); setInitialStatus(status || null); setIsModalOpen(true); };
  const openTaskDetail = (task) => { setSelectedTask(task); setShowTaskDetail(true); };

  const filteredTasks = tasks.filter(t => {
    const projMatch = selectedProject ? t.project === selectedProject : true;
    const assigneeMatch = selectedAssignee ? t.assignee === selectedAssignee : true;
    return projMatch && assigneeMatch;
  });

  const getByStatus = (status) => filteredTasks.filter(t => t.status === status);

  const projectCounts = projects.map(p => ({
    id: String(p.id),
    name: p.name,
    icon: '📁',
    count: tasks.filter(t => t.project === String(p.id)).length,
  }));

  // Projects formatted for TaskModal dropdown
  const modalProjects = projects.map(p => ({ id: String(p.id), name: p.name, icon: '📁' }));

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <NavigationSidebar />
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading board…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Head><title>Team Board</title></Head>
      <NavigationSidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Project sidebar */}
        <div className="hidden lg:block">
          <ProjectSidebar projects={projectCounts} selectedProject={selectedProject} onSelectProject={setSelectedProject} onAddProject={() => setShowAddProject(true)} />
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-800 bg-gray-900/50 px-4 lg:px-6 py-3 md:py-4 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              {/* Search */}
              <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-[120px] md:max-w-none">
                <div className="relative w-full md:w-64">
                  <svg className="w-4 h-4 md:w-5 md:h-5 absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Search..." className="pl-8 md:pl-10 pr-2 md:pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full text-sm" />
                </div>
              </div>

              {/* Assignee avatars (desktop) */}
              <div className="hidden lg:flex items-center gap-3">
                {teamMembers.map((member) => {
                  const count = tasks.filter(t => t.assignee === member.id).length;
                  const isActive = selectedAssignee === member.id;
                  return (
                    <button key={member.id} onClick={() => setSelectedAssignee(isActive ? null : member.id)}
                      className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                      title={`${member.name} — ${count} task${count !== 1 ? 's' : ''}`}>
                      <div className={`relative w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${isActive ? 'bg-purple-600 ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {member.avatar}
                        {count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{count > 9 ? '9+' : count}</span>}
                      </div>
                      <span className={`text-[10px] font-medium ${isActive ? 'text-purple-400' : 'text-gray-400'}`}>{member.name}</span>
                    </button>
                  );
                })}
                {selectedAssignee && <button onClick={() => setSelectedAssignee(null)} className="text-xs text-gray-500 hover:text-gray-300 ml-1">✕ Clear</button>}
                <button onClick={() => setShowTeamManager(true)} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors" title="Manage team members">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-1 md:gap-2">
                <div className="flex items-center bg-gray-800 rounded-lg p-0.5 md:p-1">
                  <button onClick={() => setViewMode('board')} className={`p-1.5 md:p-2 rounded transition-colors ${viewMode === 'board' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`} title="Board View">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 md:p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`} title="List View">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                </div>
                <button onClick={() => setShowMobileActivity(true)} className="hidden md:block p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </button>
                <button onClick={() => openNewTask(null)} className="p-2 md:px-4 md:py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-1 md:gap-2 shadow-lg">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span className="hidden md:inline text-sm">Add</span>
                </button>
              </div>
            </div>

            {/* Mobile assignee row */}
            {teamMembers.length > 0 && (
              <div className="flex lg:hidden items-center gap-3 mt-3 overflow-x-auto pb-1">
                {teamMembers.map((member) => {
                  const count = tasks.filter(t => t.assignee === member.id).length;
                  const isActive = selectedAssignee === member.id;
                  return (
                    <button key={member.id} onClick={() => setSelectedAssignee(isActive ? null : member.id)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                      <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-base ${isActive ? 'bg-purple-600 ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900' : 'bg-gray-700'}`}>
                        {member.avatar}
                        {count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{count > 9 ? '9+' : count}</span>}
                      </div>
                      <span className={`text-[10px] ${isActive ? 'text-purple-400' : 'text-gray-500'}`}>{member.name}</span>
                    </button>
                  );
                })}
                {selectedAssignee && <button onClick={() => setSelectedAssignee(null)} className="flex-shrink-0 text-xs text-gray-500 hover:text-gray-300">✕</button>}
              </div>
            )}
          </div>

          {/* Board / List */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'board' ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div className="h-full overflow-x-auto overflow-y-hidden">
                  <div className="flex gap-3 lg:gap-4 p-4 lg:p-6 min-w-max h-full">
                    {COLUMNS.map(col => (
                      <Column key={col.id} id={col.id} title={col.title}
                        tasks={getByStatus(col.id)} teamMembers={teamMembers}
                        onEditTask={openTaskDetail} onToggleSubtask={handleToggleSubtask}
                        onDeleteTask={handleDeleteTask} onArchiveTask={handleArchiveTask}
                        onAddTask={openNewTask}
                      />
                    ))}
                  </div>
                </div>
                <DragOverlay>
                  {activeTask && <TaskCard task={activeTask} teamMembers={teamMembers} onEdit={() => {}} onToggleSubtask={() => {}} />}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="h-full overflow-auto p-4 lg:p-6">
                <ListView
                  tasks={filteredTasks} teamMembers={teamMembers}
                  onEditTask={openTaskDetail} onToggleSubtask={handleToggleSubtask}
                  onDeleteTask={handleDeleteTask} onArchiveTask={handleArchiveTask}
                  onAddTask={openNewTask} onReorderTasks={setTasks}
                  onUpdateTask={async (taskId, updates) => {
                    const task = tasks.find(t => t.id === taskId);
                    if (!task) return;
                    const updated = { ...task, ...updates };
                    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
                    await fetch('/api/team/tasks', {
                      method: 'PUT', headers: authHeaders,
                      body: JSON.stringify({ id: parseInt(taskId), ...toTeamBody(updated) }),
                    });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed slide-out */}
      {showMobileActivity && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMobileActivity(false)} />
          <div className="fixed inset-y-0 right-0 w-80 z-50">
            <div className="h-full bg-gray-900 border-l border-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">🔔 Activity</h2>
                <button onClick={() => setShowMobileActivity(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">✕</button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ActivityFeed tasks={tasks} teamMembers={teamMembers} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Team Manager modal */}
      {showTeamManager && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowTeamManager(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl">
              <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">Manage Assignees</h2>
                <button onClick={() => setShowTeamManager(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="p-5 space-y-3">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{member.avatar}</span>
                      <span className="text-white text-sm">{member.name}</span>
                    </div>
                    <button onClick={() => handleDeleteMember(member.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 hover:bg-gray-800 rounded transition-colors">Remove</button>
                  </div>
                ))}
                <div className="border-t border-gray-800 pt-4">
                  <div className="flex gap-2">
                    <input value={newMemberAvatar} onChange={e => setNewMemberAvatar(e.target.value)} className="w-12 bg-gray-800 border border-gray-700 rounded-lg text-center text-white px-1 py-2 text-sm" placeholder="👤" />
                    <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddMember()} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg text-white px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Name" />
                    <button onClick={handleAddMember} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors">Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Project modal */}
      {showAddProject && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAddProject(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl">
              <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">New Project</h2>
                <button onClick={() => setShowAddProject(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <input
                  autoFocus
                  type="text"
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddProject(); if (e.key === 'Escape') setShowAddProject(false); }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg text-white px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowAddProject(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">Cancel</button>
                  <button onClick={handleAddProject} disabled={!newProjectName.trim()} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Create</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <TaskModal
        task={editingTask} initialStatus={initialStatus}
        isOpen={isModalOpen} teamMembers={teamMembers}
        projects={modalProjects}
        onClose={() => { setIsModalOpen(false); setInitialStatus(null); }}
        onSave={handleSaveTask}
      />

      <TaskDetail
        task={selectedTask} isOpen={showTaskDetail}
        teamMembers={teamMembers}
        onClose={() => setShowTaskDetail(false)}
        onSave={handleSaveTask} onDelete={handleDeleteTask} onArchive={handleArchiveTask}
      />
    </div>
  );
}

export default withAuth(TeamBoard);
