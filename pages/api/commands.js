import { createClient } from '@supabase/supabase-js';

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
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('commands')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { name, category, command_group, description, steps, shortcut, logo } = req.body;
    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'name and description are required' });
    }
    // Find current minimum sort_order so new command appears at top
    const { data: existing } = await supabase
      .from('commands')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .limit(1);
    const minOrder = existing?.[0]?.sort_order ?? 0;
    const newOrder = minOrder - 1;

    const { data, error } = await supabase
      .from('commands')
      .insert({
        user_id: user.id,
        name: name.trim(),
        category: category || 'system',
        command_group: command_group || 'resources',
        description: description.trim(),
        steps: steps || [],
        shortcut: shortcut || null,
        logo: logo || null,
        sort_order: newOrder,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, name, category, command_group, description, steps, shortcut, logo, sort_order } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { data, error } = await supabase
      .from('commands')
      .update({
        name: name?.trim(),
        category,
        command_group,
        description: description?.trim(),
        steps,
        shortcut: shortcut || null,
        logo: logo || null,
        sort_order,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabase
      .from('commands')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
