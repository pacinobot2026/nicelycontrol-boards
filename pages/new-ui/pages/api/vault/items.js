import { supabase } from '../../../lib/supabase';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user || null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform to match frontend expected format
    const items = (data || []).map(item => ({
      id: item.id.toString(),
      title: item.title,
      category: item.category,
      type: item.type,
      url: item.resource_url || item.file_path,
      notes: item.notes || '',
      tags: item.tags || [],
      createdAt: item.created_at
    }));

    res.status(200).json({ items });
  } catch (error) {
    console.error('Error reading vault data:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
}
