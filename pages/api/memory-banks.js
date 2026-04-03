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

  // GET - list all memory banks with source counts
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('memory_banks')
      .select('*, memory_sources(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // POST - create bank OR add source to bank
  if (req.method === 'POST') {
    const { action } = req.body;

    // Add source to existing bank
    if (action === 'add-source') {
      const { bank_id, filename, content, source_type, file_url, summary } = req.body;
      if (!bank_id || !content) return res.status(400).json({ error: 'bank_id and content are required' });

      const { data, error } = await supabase
        .from('memory_sources')
        .insert({
          bank_id,
          user_id: user.id,
          filename: filename || null,
          content,
          source_type: source_type || 'text',
          file_url: file_url || null,
          summary: summary || null,
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      // Update source count
      await supabase.rpc('increment_bank_source_count', { bank_id_param: bank_id }).catch(() => {});

      return res.status(201).json(data);
    }

    // Create new bank
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { data, error } = await supabase
      .from('memory_banks')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        source_count: 0,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // DELETE - delete bank and all its sources
  if (req.method === 'DELETE') {
    const id = req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: 'id is required' });

    // Sources cascade delete automatically
    const { error } = await supabase
      .from('memory_banks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
