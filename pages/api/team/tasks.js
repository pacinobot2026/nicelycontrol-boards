import { supabase } from '../../../lib/supabase';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return tags.split(',').map(t => t.trim()).filter(Boolean);
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { project_id } = req.query;

    let query = supabase
      .from('team_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (project_id) query = query.eq('project_id', parseInt(project_id));

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ tasks: data || [] });
  }

  if (req.method === 'POST') {
    const { title, description, status, priority, tags, progress, assignee, start_date, due_date, project_id } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const { data, error } = await supabase
      .from('team_tasks')
      .insert([{
        title,
        description: description || '',
        status: status || 'inbox',
        priority: priority || 'medium',
        tags: parseTags(tags),
        progress: parseInt(progress) || 0,
        assignee: assignee || '',
        start_date: start_date || null,
        due_date: due_date || null,
        project_id: project_id || null,
        user_id: user.id,
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ task: data });
  }

  if (req.method === 'PUT') {
    const { id, title, description, status, priority, tags, progress, assignee, start_date, due_date, project_id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (tags !== undefined) updates.tags = parseTags(tags);
    if (progress !== undefined) updates.progress = parseInt(progress) || 0;
    if (assignee !== undefined) updates.assignee = assignee;
    if (start_date !== undefined) updates.start_date = start_date || null;
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (project_id !== undefined) updates.project_id = project_id || null;

    const { data, error } = await supabase
      .from('team_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ task: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('team_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
