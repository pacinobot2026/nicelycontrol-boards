import { supabase } from '../../../lib/supabase';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleCreate(req, res);
  } else if (req.method === 'PUT') {
    return handleUpdate(req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleCreate(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { title, category, type, url, notes, tags } = req.body;

    if (!title || !category || !type || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newItem = {
      title,
      category,
      type,
      resource_url: url,
      notes: notes || '',
      tags: tags || [],
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('vault_items')
      .insert([newItem])
      .select()
      .single();

    if (error) throw error;

    // Transform to match frontend expected format
    const item = {
      id: data.id.toString(),
      title: data.title,
      category: data.category,
      type: data.type,
      url: data.resource_url || data.file_path,
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: data.created_at
    };

    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
}

async function handleUpdate(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { id, title, category, type, url, notes, tags } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Item ID required' });
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (title) updates.title = title;
    if (category) updates.category = category;
    if (type) updates.type = type;
    if (url) updates.resource_url = url;
    if (notes !== undefined) updates.notes = notes;
    if (tags !== undefined) updates.tags = tags;

    const { data, error } = await supabase
      .from('vault_items')
      .update(updates)
      .eq('id', parseInt(id))
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Transform to match frontend expected format
    const item = {
      id: data.id.toString(),
      title: data.title,
      category: data.category,
      type: data.type,
      url: data.resource_url || data.file_path,
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: data.created_at
    };

    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
}

async function handleDelete(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Item ID required' });
    }

    const { error } = await supabase
      .from('vault_items')
      .delete()
      .eq('id', parseInt(id))
      .eq('user_id', user.id);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
}
