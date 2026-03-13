import { updateClip, getClip } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

const POSTBRIDGE_BASE = 'https://api.post-bridge.com/v1';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

async function getPostBridgeKey(userId) {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', 'postbridge_api_key')
    .single();
  return data?.value || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clipId, scheduledAt } = req.body;
  if (!clipId) return res.status(400).json({ error: 'Clip ID required' });

  try {
    const clip = await getClip(clipId);
    if (!clip) return res.status(404).json({ error: 'Clip not found' });

    // If this is a PostBridge draft, schedule/publish it
    if (clip.postbridge_post_id) {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const apiKey = await getPostBridgeKey(user.id);
      if (!apiKey) return res.status(400).json({ error: 'PostBridge API key not configured' });

      const patchBody = { is_draft: false };
      if (scheduledAt) patchBody.scheduled_at = scheduledAt;

      await axios.patch(
        `${POSTBRIDGE_BASE}/posts/${clip.postbridge_post_id}`,
        patchBody,
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
      );
    }

    await updateClip(clipId, { status: 'approved', scheduled_at: scheduledAt || null });
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Approve error:', error.response?.data || error.message);
    const msg = error.response?.data?.message || error.message;
    return res.status(422).json({ error: msg });
  }
}
