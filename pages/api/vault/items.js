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
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const items = (data || []).map(item => ({
      id: item.id.toString(),
      title: item.title,
      category: item.category,
      type: item.type,
      url: item.resource_url || item.file_path,
      notes: item.notes || '',
      tags: item.tags || [],
      createdAt: item.created_at,
    }));

    return res.status(200).json({ items });
  }

  if (req.method === 'POST') {
    const { title, category, type, url, notes, tags } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });

    const { data, error } = await supabase
      .from('vault_items')
      .insert({ user_id: user.id, title: title.trim(), category, type, resource_url: url || null, notes: notes || '', tags: tags || [] })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ item: { id: data.id.toString(), title: data.title, category: data.category, type: data.type, url: data.resource_url, notes: data.notes, tags: data.tags, createdAt: data.created_at } });
  }

  if (req.method === 'PUT') {
    const { id, title, category, type, url, notes, tags } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (type !== undefined) updates.type = type;
    if (url !== undefined) updates.resource_url = url;
    if (notes !== undefined) updates.notes = notes;
    if (tags !== undefined) updates.tags = tags;

    const { data, error } = await supabase
      .from('vault_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ item: { id: data.id.toString(), title: data.title, category: data.category, type: data.type, url: data.resource_url, notes: data.notes, tags: data.tags, createdAt: data.created_at } });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('vault_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
