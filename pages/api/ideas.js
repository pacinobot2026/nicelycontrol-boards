import { supabase } from '../../lib/supabase';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ideas: data });
  }

  if (req.method === 'POST') {
    const { title, description, category, status, priority, tags } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const { data, error } = await supabase
      .from('ideas')
      .insert([{ title, description, category, status, priority, tags }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ idea: data });
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { data, error } = await supabase
      .from('ideas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ idea: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
