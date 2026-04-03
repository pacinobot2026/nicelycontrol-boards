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

  // GET - list article ideas
  if (req.method === 'GET') {
    const { status } = req.query;
    let query = supabase
      .from('article_ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ articles: data, total: data.length });
  }

  // POST - add article idea (from /local-articles skill)
  if (req.method === 'POST') {
    const { title, url, description, image, publication, city } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'title and url are required' });

    // Check for duplicate URL
    const { data: existing } = await supabase
      .from('article_ideas')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', url)
      .single();

    if (existing) {
      return res.status(200).json({ duplicate: true, message: 'Article already in board' });
    }

    const { data, error } = await supabase
      .from('article_ideas')
      .insert({
        user_id: user.id,
        title,
        url,
        description: description || null,
        image: image || null,
        publication: publication || city || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // PUT - update status (approve/reject)
  if (req.method === 'PUT') {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });

    const { data, error } = await supabase
      .from('article_ideas')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // DELETE - remove idea
  if (req.method === 'DELETE') {
    const id = req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('article_ideas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
