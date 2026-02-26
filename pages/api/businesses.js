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

  // GET — fetch all businesses with their cards and resources
  if (req.method === 'GET') {
    const { data: businesses, error: bizErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (bizErr) return res.status(500).json({ error: bizErr.message });

    if (businesses.length === 0) {
      return res.status(200).json({ businesses: [] });
    }

    const bizIds = businesses.map(b => b.id);

    const [cardsRes, resourcesRes] = await Promise.all([
      supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .in('business_id', bizIds)
        .order('position', { ascending: true }),
      supabase
        .from('business_resources')
        .select('*')
        .eq('user_id', user.id)
        .in('business_id', bizIds)
        .order('created_at', { ascending: true }),
    ]);

    if (cardsRes.error) return res.status(500).json({ error: cardsRes.error.message });
    if (resourcesRes.error) return res.status(500).json({ error: resourcesRes.error.message });

    const result = businesses.map(b => ({
      ...b,
      cards: cardsRes.data.filter(c => c.business_id === b.id),
      resources: resourcesRes.data.filter(r => r.business_id === b.id),
    }));

    return res.status(200).json({ businesses: result });
  }

  // POST — create business, card, or resource
  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'add_business') {
      const { name, columns } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });

      const { data, error } = await supabase
        .from('businesses')
        .insert([{
          user_id: user.id,
          name,
          ...(columns ? { columns } : {}),
        }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ business: { ...data, cards: [], resources: [] } });
    }

    if (action === 'add_card') {
      const { business_id, title, description, column_name, labels, due_date, position } = req.body;
      if (!business_id || !title || !column_name) {
        return res.status(400).json({ error: 'business_id, title, and column_name are required' });
      }

      const { data, error } = await supabase
        .from('business_cards')
        .insert([{
          user_id: user.id,
          business_id,
          title,
          description: description || '',
          column_name,
          labels: labels || [],
          due_date: due_date || null,
          position: position || 0,
        }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ card: data });
    }

    if (action === 'add_resource') {
      const { business_id, title, url, type } = req.body;
      if (!business_id || !title) {
        return res.status(400).json({ error: 'business_id and title are required' });
      }

      const { data, error } = await supabase
        .from('business_resources')
        .insert([{
          user_id: user.id,
          business_id,
          title,
          url: url || '',
          type: type || 'link',
        }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ resource: data });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  // PUT — update business, card, or resource
  if (req.method === 'PUT') {
    const { type, id, ...updates } = req.body;
    if (!type || !id) return res.status(400).json({ error: 'type and id are required' });

    if (type === 'business') {
      const allowed = {};
      if (updates.name !== undefined) allowed.name = updates.name;
      if (updates.columns !== undefined) allowed.columns = updates.columns;
      allowed.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('businesses')
        .update(allowed)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ business: data });
    }

    if (type === 'card') {
      const allowed = {};
      if (updates.title !== undefined) allowed.title = updates.title;
      if (updates.description !== undefined) allowed.description = updates.description;
      if (updates.column_name !== undefined) allowed.column_name = updates.column_name;
      if (updates.labels !== undefined) allowed.labels = updates.labels;
      if (updates.due_date !== undefined) allowed.due_date = updates.due_date;
      if (updates.position !== undefined) allowed.position = updates.position;
      allowed.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('business_cards')
        .update(allowed)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ card: data });
    }

    if (type === 'resource') {
      const allowed = {};
      if (updates.title !== undefined) allowed.title = updates.title;
      if (updates.url !== undefined) allowed.url = updates.url;
      if (updates.type !== undefined) allowed.type = updates.type;

      const { data, error } = await supabase
        .from('business_resources')
        .update(allowed)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ resource: data });
    }

    return res.status(400).json({ error: 'Invalid type' });
  }

  // DELETE — delete business, card, or resource
  if (req.method === 'DELETE') {
    const { type, id } = req.body;
    if (!type || !id) return res.status(400).json({ error: 'type and id are required' });

    const table = type === 'business' ? 'businesses'
      : type === 'card' ? 'business_cards'
      : type === 'resource' ? 'business_resources'
      : null;

    if (!table) return res.status(400).json({ error: 'Invalid type' });

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
