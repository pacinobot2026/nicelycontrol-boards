import { createClient } from '@supabase/supabase-js';

const CHAD_USER_ID = '08dee908-d31b-4c19-ae7d-227ccbb068cf';

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
  const { data, error } = await supabase
    .from('kanban_tasks')
    .select('task_data')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(row => row.task_data);
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { method } = req;

  if (method === 'GET') {
    try {
      const tasks = await readTasks();
      return res.json(tasks);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (method === 'POST') {
    try {
      const body = req.body;

      if (body.action === 'updateAll' && body.tasks) {
        // Bulk replace — upsert all tasks
        for (const task of body.tasks) {
          await supabase.from('kanban_tasks').upsert({
            id: task.id,
            user_id: CHAD_USER_ID,
            task_data: task,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        }
        return res.json({ success: true, savedTasks: body.tasks.length });
      }

      // Create new task
      const newTask = { ...body };
      newTask.id = `task-${Date.now()}`;
      newTask.createdAt = new Date().toISOString();
      newTask.updatedAt = new Date().toISOString();

      const { error } = await supabase.from('kanban_tasks').insert({
        id: newTask.id,
        user_id: CHAD_USER_ID,
        task_data: newTask,
        created_at: newTask.createdAt,
        updated_at: newTask.updatedAt,
      });
      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json(newTask);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (method === 'PUT') {
    try {
      const updatedTask = { ...req.body, updatedAt: new Date().toISOString() };

      const { error } = await supabase.from('kanban_tasks').upsert({
        id: updatedTask.id,
        user_id: CHAD_USER_ID,
        task_data: updatedTask,
        updated_at: updatedTask.updatedAt,
      }, { onConflict: 'id' });

      if (error) return res.status(500).json({ error: error.message });
      return res.json(updatedTask);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (method === 'PATCH') {
    try {
      const { id, ...updates } = req.body;

      // Read existing task
      const { data, error: readError } = await supabase
        .from('kanban_tasks')
        .select('task_data')
        .eq('id', id)
        .single();
      if (readError) return res.status(404).json({ error: 'Task not found' });

      const updatedTask = { ...data.task_data, ...updates, updatedAt: new Date().toISOString() };

      const { error } = await supabase.from('kanban_tasks').update({
        task_data: updatedTask,
        updated_at: updatedTask.updatedAt,
      }).eq('id', id);

      if (error) return res.status(500).json({ error: error.message });
      return res.json(updatedTask);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID required' });

      const { error } = await supabase.from('kanban_tasks').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
