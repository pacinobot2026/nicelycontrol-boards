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

  // GET - list all publications
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('publications')
      .select('*, articles(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // POST - create publication
  if (req.method === 'POST') {
    const { name, slug, description, logo_url, city, state, letterman_id, letterman_url } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { data, error } = await supabase
      .from('publications')
      .insert({
        user_id: user.id,
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: description || null,
        logo_url: logo_url || null,
        city: city || null,
        state: state || null,
        letterman_id: letterman_id || null,
        letterman_url: letterman_url || null,
        active: true,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // PUT - update publication
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    delete updates.user_id;
    delete updates.created_at;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('publications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // DELETE - delete publication
  if (req.method === 'DELETE') {
    const id = req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('publications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
