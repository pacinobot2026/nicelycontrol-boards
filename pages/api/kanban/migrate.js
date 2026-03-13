import { kv } from '@vercel/kv';
import { createClient } from '@supabase/supabase-js';

const TASKS_KEY = 'kanban:tasks';
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Read all tasks from KV
    const tasks = await kv.get(TASKS_KEY);
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.json({ migrated: 0, message: 'No tasks found in KV' });
    }

    // Insert each task into Supabase under Chad's user_id
    let migrated = 0;
    for (const task of tasks) {
      const { error } = await supabase
        .from('kanban_tasks')
        .upsert({
          id: task.id,
          user_id: CHAD_USER_ID,
          task_data: task,
          created_at: task.createdAt || new Date().toISOString(),
          updated_at: task.updatedAt || new Date().toISOString(),
        }, { onConflict: 'id' });

      if (!error) migrated++;
    }

    return res.json({ migrated, total: tasks.length, message: `Migrated ${migrated} of ${tasks.length} tasks to Supabase` });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: error.message });
  }
}
