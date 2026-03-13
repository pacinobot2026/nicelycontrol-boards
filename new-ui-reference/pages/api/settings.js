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
      .from('settings')
      .select('key, value')
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });

    const settings = {};
    (data || []).forEach(row => { settings[row.key] = row.value; });
    return res.status(200).json({ settings });
  }

  if (req.method === 'POST') {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key is required' });

    const { error } = await supabase
      .from('settings')
      .upsert(
        { user_id: user.id, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      );

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
