import { supabase } from '../../../../lib/supabase';
import axios from 'axios';

async function getPBKey(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('user_id', user.id)
    .eq('key', 'postbridge_api_key')
    .single();
  return data?.value || null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const apiKey = await getPBKey(req);
  if (!apiKey) return res.status(401).json({ error: 'PostBridge API key not configured' });

  try {
    const { data } = await axios.get(
      `https://api.post-bridge.com/v1/posts/${id}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return res.status(200).json(data);
  } catch (err) {
    console.error('PostBridge post fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch post' });
  }
}
