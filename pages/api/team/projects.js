import { supabase } from '../../../lib/supabase';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data: projects, error } = await supabase
      .from('team_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');

    if (error) return res.status(500).json({ error: error.message });

    // Attach task counts
    const { data: taskCounts } = await supabase
      .from('team_tasks')
      .select('project_id')
      .eq('user_id', user.id)
      .not('project_id', 'is', null);

    const countMap = {};
    (taskCounts || []).forEach(t => {
      countMap[t.project_id] = (countMap[t.project_id] || 0) + 1;
    });

    const result = (projects || []).map(p => ({ ...p, task_count: countMap[p.id] || 0 }));
    return res.status(200).json({ projects: result });
  }

  if (req.method === 'POST') {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { data, error } = await supabase
      .from('team_projects')
      .insert([{ name, color: color || '#6366f1', user_id: user.id }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ project: { ...data, task_count: 0 } });
  }

  if (req.method === 'PUT') {
    const { id, name, color } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const updates = {};
    if (name) updates.name = name;
    if (color) updates.color = color;

    const { data, error } = await supabase
      .from('team_projects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ project: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('team_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
