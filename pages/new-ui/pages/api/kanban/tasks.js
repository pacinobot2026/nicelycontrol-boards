import { kv } from '@vercel/kv';
import { createClient } from '@supabase/supabase-js';

const TASKS_KEY = 'kanban:tasks';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

async function readTasks() {
  try {
    const tasks = await kv.get(TASKS_KEY);
    return tasks || [];
  } catch (error) {
    console.error('KV read error:', error);
    return [];
  }
}

async function writeTasks(tasks) {
  try {
    await kv.set(TASKS_KEY, tasks);
  } catch (error) {
    console.error('KV write error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { method } = req;

  if (method === 'GET') {
    const tasks = await readTasks();
    return res.json(tasks);
  }

  if (method === 'POST') {
    try {
      const body = req.body;

      if (body.action === 'updateAll' && body.tasks) {
        await writeTasks(body.tasks);
        return res.json({ success: true, savedTasks: body.tasks.length });
      }

      const tasks = await readTasks();
      const newTask = body;
      newTask.id = `task-${Date.now()}`;
      newTask.createdAt = new Date().toISOString();
      newTask.updatedAt = new Date().toISOString();
      tasks.push(newTask);
      await writeTasks(tasks);

      return res.status(201).json(newTask);
    } catch (error) {
      console.error('POST error:', error);
      return res.status(500).json({ error: 'Failed to create task' });
    }
  }

  if (method === 'PUT') {
    try {
      const tasks = await readTasks();
      const updatedTask = req.body;
      const index = tasks.findIndex(t => t.id === updatedTask.id);
      if (index === -1) return res.status(404).json({ error: 'Task not found' });

      updatedTask.updatedAt = new Date().toISOString();
      tasks[index] = updatedTask;
      await writeTasks(tasks);

      return res.json(updatedTask);
    } catch (error) {
      console.error('PUT error:', error);
      return res.status(500).json({ error: 'Failed to update task' });
    }
  }

  if (method === 'PATCH') {
    try {
      const tasks = await readTasks();
      const { id, ...updates } = req.body;
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) return res.status(404).json({ error: 'Task not found' });

      tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
      await writeTasks(tasks);

      return res.json(tasks[index]);
    } catch (error) {
      console.error('PATCH error:', error);
      return res.status(500).json({ error: 'Failed to update task' });
    }
  }

  if (method === 'DELETE') {
    try {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'ID required' });

      const tasks = await readTasks();
      const filtered = tasks.filter(t => t.id !== id);
      await writeTasks(filtered);

      return res.json({ success: true });
    } catch (error) {
      console.error('DELETE error:', error);
      return res.status(500).json({ error: 'Failed to delete task' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
