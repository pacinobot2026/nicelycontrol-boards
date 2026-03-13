import { supabase } from '../../lib/supabase';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ bookmarks: data });
  }

  if (req.method === 'POST') {
    const { title, url, description, category, status, tags } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'title and url are required' });

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{ user_id: user.id, title, url, description, category, status, tags }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ bookmark: data });
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { data, error } = await supabase
      .from('bookmarks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ bookmark: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
