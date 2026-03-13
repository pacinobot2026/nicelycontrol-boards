import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import NavigationSidebar from '../components/NavigationSidebar';
import withAuth from '../lib/withAuth';
import { useAuth } from '../lib/authContext';

const COLUMNS = [
  { id: 'inbox',       label: 'Inbox',       color: '#9ca3af' },
  { id: 'assigned',    label: 'Assigned',    color: '#60a5fa' },
  { id: 'in_progress', label: 'In Progress', color: '#a78bfa' },
  { id: 'review',      label: 'Review',      color: '#fbbf24' },
  { id: 'done',        label: 'Done',        color: '#34d399' },
];

// Match projects.js priority tag style
const PRIORITY_STYLE = {
  high:   { background: 'rgba(127,29,29,0.4)',   color: '#fca5a5', border: '1px solid rgba(185,28,28,0.5)'   },
  medium: { background: 'rgba(120,53,15,0.4)',   color: '#fcd34d', border: '1px solid rgba(180,83,9,0.5)'   },
  low:    { background: 'rgba(6,78,59,0.4)',     color: '#6ee7b7', border: '1px solid rgba(4,120,87,0.5)'   },
};

const PROJECT_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16'];

function emptyColumns() {
  return { inbox: [], assigned: [], in_progress: [], review: [], done: [] };
}

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, index, projects, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const project = projects.find(p => p.id === task.project_id);
  const tags = task.tags || [];
  const pri = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium;

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            background: snapshot.isDragging ? 'rgba(88,28,135,0.15)' : 'rgba(31,41,55,0.7)',
            border: snapshot.isDragging ? '1px solid rgba(147,51,234,0.6)' : '1px solid rgba(75,85,99,0.5)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 8,
            userSelect: 'none',
            boxShadow: snapshot.isDragging ? '0 12px 40px rgba(88,28,135,0.4)' : 'none',
            ...provided.draggableProps.style,
          }}
        >
          {/* Priority + menu */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 4, padding: '2px 8px', ...pri }}>
              {task.priority || 'medium'}
            </span>
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => setMenuOpen(o => !o)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1 }}
              >···</button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#111827', border: '1px solid rgba(55,65,81,1)', borderRadius: 8, zIndex: 50, minWidth: 100, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  <button onMouseDown={e => e.stopPropagation()} onClick={() => { setMenuOpen(false); onEdit(); }}
                    style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#e5e7eb', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onMouseDown={e => e.stopPropagation()} onClick={() => { setMenuOpen(false); onDelete(); }}
                    style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#f87171', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <p style={{ color: '#f9fafb', fontSize: 14, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.4 }}>{task.title}</p>

          {/* Description */}
          {task.description && (
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '0 0 8px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {task.description}
            </p>
          )}

          {/* Project badge */}
          {project && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${project.color}20`, border: `1px solid ${project.color}40`, borderRadius: 4, padding: '2px 8px', marginBottom: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
              <span style={{ color: project.color, fontSize: 11, fontWeight: 600 }}>{project.name}</span>
            </div>
          )}

          {/* Tags — match projects.js tag style */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {tags.slice(0, 4).map(tag => (
                <span key={tag} style={{ background: 'rgba(88,28,135,0.3)', border: '1px solid rgba(109,40,217,0.4)', borderRadius: 4, padding: '1px 7px', fontSize: 11, color: '#d8b4fe' }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {task.progress > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#6b7280', fontSize: 11 }}>Progress</span>
                <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>{task.progress}%</span>
              </div>
              <div style={{ height: 3, background: 'rgba(55,65,81,0.8)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${Math.min(100, task.progress)}%`, background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 2 }} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ color: '#6b7280', fontSize: 11 }}>
              {task.start_date && task.due_date
                ? `${fmt(task.start_date)} → ${fmt(task.due_date)}`
                : fmt(task.due_date) || fmt(task.start_date)}
            </span>
            {task.assignee && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(88,28,135,0.4)', border: '1px solid rgba(109,40,217,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d8b4fe', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {task.assignee.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

// ─── Edit Modal — matches projects.js modal style ─────────────────────────────
function EditModal({ task, projects, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'medium',
    assignee: task.assignee || '',
    due_date: task.due_date ? task.due_date.slice(0, 10) : '',
    start_date: task.start_date ? task.start_date.slice(0, 10) : '',
    tags: (task.tags || []).join(', '),
    progress: task.progress || 0,
    project_id: task.project_id || '',
  });

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  const inputStyle = { background: 'rgba(31,41,55,1)', border: '1px solid rgba(75,85,99,1)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 6 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }} onClick={onClose}>
      <div style={{ background: '#111827', border: '1px solid rgba(55,65,81,1)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#f9fafb', fontSize: 18, fontWeight: 700, margin: 0 }}>Edit Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Title *" value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
          <textarea placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />

          <div>
            <label style={labelStyle}>Priority</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['high', 'medium', 'low'].map(p => (
                <button key={p} onClick={() => set('priority', p)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                  background: form.priority === p ? PRIORITY_STYLE[p].background : 'rgba(31,41,55,0.5)',
                  border: form.priority === p ? PRIORITY_STYLE[p].border : '1px solid rgba(75,85,99,0.5)',
                  color: form.priority === p ? PRIORITY_STYLE[p].color : '#6b7280',
                }}>{p}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Assignee</label>
              <input placeholder="Name" value={form.assignee} onChange={e => set('assignee', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Progress %</label>
              <input type="number" min={0} max={100} value={form.progress} onChange={e => set('progress', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <input placeholder="Tags (comma separated)" value={form.tags} onChange={e => set('tags', e.target.value)} style={inputStyle} />

          {projects.length > 0 && (
            <select value={form.project_id} onChange={e => set('project_id', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: 'none', color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.title.trim()} style={{ padding: '8px 20px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: form.title.trim() ? 1 : 0.5 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function TeamBoard() {
  const { session } = useAuth();
  const [columns, setColumns] = useState(emptyColumns());
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');

  const [addingInCol, setAddingInCol] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);

  const [editingTask, setEditingTask] = useState(null);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  });

  useEffect(() => {
    if (session) { loadProjects(); loadTasks(); }
  }, [session]);

  useEffect(() => {
    if (session) loadTasks();
  }, [selectedProject]);

  async function loadProjects() {
    try {
      const res = await fetch('/api/team/projects', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) { console.error(err); }
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const url = selectedProject ? `/api/team/tasks?project_id=${selectedProject}` : '/api/team/tasks';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json();
      const cols = emptyColumns();
      (data.tasks || []).forEach(t => { if (cols[t.status]) cols[t.status].push(t); });
      setColumns(cols);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId);

    setColumns(prev => {
      const srcList = [...prev[source.droppableId]];
      const taskIdx = srcList.findIndex(t => t.id === taskId);
      if (taskIdx === -1) return prev;
      const [moved] = srcList.splice(taskIdx, 1);
      moved.status = destination.droppableId;

      if (source.droppableId === destination.droppableId) {
        srcList.splice(destination.index, 0, moved);
        return { ...prev, [source.droppableId]: srcList };
      }
      const destList = [...prev[destination.droppableId]];
      destList.splice(destination.index, 0, moved);
      return { ...prev, [source.droppableId]: srcList, [destination.droppableId]: destList };
    });

    if (source.droppableId !== destination.droppableId) {
      fetch('/api/team/tasks', {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ id: taskId, status: destination.droppableId }),
      }).catch(console.error);
    }
  }

  async function handleAddTask(colId) {
    const title = newTaskTitle.trim();
    setAddingInCol(null);
    setNewTaskTitle('');
    if (!title) return;
    try {
      const res = await fetch('/api/team/tasks', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ title, status: colId, project_id: selectedProject || null }),
      });
      const data = await res.json();
      if (data.task) {
        setColumns(prev => ({ ...prev, [colId]: [...prev[colId], data.task] }));
        loadProjects();
      }
    } catch (err) { console.error(err); }
  }

  async function handleAddProject() {
    const name = newProjectName.trim();
    setAddingProject(false);
    setNewProjectName('');
    if (!name) return;
    try {
      const res = await fetch('/api/team/projects', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name, color: newProjectColor }),
      });
      const data = await res.json();
      if (data.project) setProjects(prev => [...prev, data.project]);
    } catch (err) { console.error(err); }
  }

  async function handleDeleteTask(taskId, status) {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch('/api/team/tasks', { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ id: taskId }) });
      setColumns(prev => ({ ...prev, [status]: prev[status].filter(t => t.id !== taskId) }));
      loadProjects();
    } catch (err) { console.error(err); }
  }

  async function handleSaveEdit(form) {
    try {
      const res = await fetch('/api/team/tasks', {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ id: editingTask.id, ...form }),
      });
      const data = await res.json();
      if (data.task) {
        const s = data.task.status;
        setColumns(prev => ({ ...prev, [s]: prev[s].map(t => t.id === data.task.id ? data.task : t) }));
      }
    } catch (err) { console.error(err); }
    setEditingTask(null);
  }

  async function handleDeleteProject(id) {
    if (!confirm('Delete this project? Tasks will remain but become unassigned.')) return;
    try {
      await fetch('/api/team/projects', { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ id }) });
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProject === id) setSelectedProject(null);
      loadTasks();
    } catch (err) { console.error(err); }
  }

  const totalTasks = Object.values(columns).reduce((s, c) => s + c.length, 0);
  const visibleProjects = projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Head><title>Team Board</title></Head>
      <NavigationSidebar />

      {/* ── Left panel ── */}
      <div style={{ width: 220, background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Projects</span>
            <button
              onClick={() => { setAddingProject(true); setNewProjectName(''); setNewProjectColor(PROJECT_COLORS[0]); }}
              style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#c4b5fd', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >+ Add</button>
          </div>
          <input
            placeholder="Search projects..."
            value={projectSearch}
            onChange={e => setProjectSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(31,41,55,0.6)', border: '1px solid rgba(75,85,99,0.5)', borderRadius: 7, padding: '6px 10px', color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          <ProjectRow label="All Projects" color="#7c3aed" count={totalTasks} active={selectedProject === null} onClick={() => setSelectedProject(null)} />
          {visibleProjects.map(proj => (
            <ProjectRow
              key={proj.id}
              label={proj.name}
              color={proj.color}
              count={proj.task_count || 0}
              active={selectedProject === proj.id}
              onClick={() => setSelectedProject(selectedProject === proj.id ? null : proj.id)}
              onDelete={() => handleDeleteProject(proj.id)}
            />
          ))}

          {addingProject && (
            <div style={{ background: 'rgba(31,41,55,0.8)', borderRadius: 8, padding: '10px', margin: '4px 2px', border: '1px solid rgba(75,85,99,0.5)' }}>
              <input
                autoFocus
                placeholder="Project name..."
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddProject(); if (e.key === 'Escape') setAddingProject(false); }}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#f9fafb', fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                {PROJECT_COLORS.map(c => (
                  <button key={c} onClick={() => setNewProjectColor(c)} style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: newProjectColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleAddProject} style={{ flex: 1, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                <button onClick={() => setAddingProject(false)} style={{ flex: 1, background: 'rgba(55,65,81,0.8)', color: '#9ca3af', border: '1px solid rgba(75,85,99,0.5)', borderRadius: 6, padding: '5px 0', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Board area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div>
            <h1 style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              ▦ Team Board
            </h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              {totalTasks} task{totalTasks !== 1 ? 's' : ''}
              {selectedProject && projects.find(p => p.id === selectedProject) && (
                <span style={{ color: '#9ca3af' }}> · {projects.find(p => p.id === selectedProject).name}</span>
              )}
            </p>
          </div>
        </div>

        {/* Kanban */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '16px 16px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', fontSize: 14 }}>Loading board…</div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div style={{ display: 'flex', gap: 12, height: '100%', minWidth: 'max-content', alignItems: 'flex-start' }}>
                {COLUMNS.map(col => {
                  const tasks = columns[col.id] || [];
                  return (
                    <div key={col.id} style={{ width: 280, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', maxHeight: '100%' }}>
                      {/* Column header */}
                      <div style={{ padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                        <span style={{ color: '#f3f4f6', fontSize: 13, fontWeight: 600, flex: 1 }}>{col.label}</span>
                        <span style={{ background: 'rgba(55,65,81,0.8)', color: '#9ca3af', borderRadius: 5, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{tasks.length}</span>
                        <button
                          onClick={() => { setAddingInCol(col.id); setNewTaskTitle(''); }}
                          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}
                        >+</button>
                      </div>

                      <Droppable droppableId={col.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{
                              flex: 1,
                              overflowY: 'auto',
                              padding: '10px 10px 6px',
                              background: snapshot.isDraggingOver ? 'rgba(124,58,237,0.06)' : 'transparent',
                              minHeight: 80,
                            }}
                          >
                            {tasks.length === 0 && !snapshot.isDraggingOver && addingInCol !== col.id && (
                              <p style={{ textAlign: 'center', color: '#374151', fontSize: 12, padding: '24px 0', userSelect: 'none' }}>Drop tasks here</p>
                            )}

                            {tasks.map((task, idx) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                index={idx}
                                projects={projects}
                                onEdit={() => setEditingTask(task)}
                                onDelete={() => handleDeleteTask(task.id, task.status)}
                              />
                            ))}
                            {provided.placeholder}

                            {addingInCol === col.id && (
                              <div style={{ background: 'rgba(31,41,55,0.8)', borderRadius: 10, padding: '10px 12px', marginTop: 4, border: '1px solid rgba(124,58,237,0.4)' }}>
                                <input
                                  autoFocus
                                  placeholder="Task title…"
                                  value={newTaskTitle}
                                  onChange={e => setNewTaskTitle(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleAddTask(col.id); if (e.key === 'Escape') setAddingInCol(null); }}
                                  style={{ width: '100%', background: 'transparent', border: 'none', color: '#f9fafb', fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => handleAddTask(col.id)} style={{ flex: 1, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                                  <button onClick={() => setAddingInCol(null)} style={{ flex: 1, background: 'rgba(55,65,81,0.8)', color: '#9ca3af', border: '1px solid rgba(75,85,99,0.5)', borderRadius: 6, padding: '6px 0', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      {editingTask && (
        <EditModal task={editingTask} projects={projects} onSave={handleSaveEdit} onClose={() => setEditingTask(null)} />
      )}
    </div>
  );
}

function ProjectRow({ label, color, count, active, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: 'relative', borderRadius: 7 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        onClick={onClick}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
          borderRadius: 7, cursor: 'pointer', border: 'none', textAlign: 'left',
          background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
          color: active ? '#e9d5ff' : '#9ca3af',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#6b7280', background: 'rgba(55,65,81,0.6)', borderRadius: 4, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{count}</span>
      </button>
      {onDelete && hovered && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
        >×</button>
      )}
    </div>
  );
}

export default withAuth(TeamBoard);
