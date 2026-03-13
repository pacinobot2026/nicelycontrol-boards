import { getPendingClips, getApprovedClips, getPublishedClips, getRejectedClips, getStats, getCategories, getAllClips, addClip, updateClip, deleteClip, getClip } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

export default async function handler(req, res) {
  // Password protection removed - public access

  if (req.method === 'POST') {
    const { postbridge_media_id, postbridge_media_url, title, caption, account_ids, category } = req.body;
    if (!postbridge_media_id) return res.status(400).json({ error: 'postbridge_media_id is required' });

    // Get user + PostBridge key
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { data: setting } = await supabase
      .from('settings').select('value')
      .eq('user_id', user.id).eq('key', 'postbridge_api_key').single();
    const apiKey = setting?.value;
    if (!apiKey) return res.status(400).json({ error: 'PostBridge API key not configured' });

    try {
      // Create PostBridge draft
      const pbRes = await axios.post(
        'https://api.post-bridge.com/v1/posts',
        {
          caption: caption || title || '',
          social_accounts: account_ids || [],
          media: [postbridge_media_id],
          is_draft: true,
        },
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
      );
      const postbridgePostId = pbRes.data.id;

      const clip_id = `pb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const clip = await addClip({
        clip_id,
        title: title || caption || 'Untitled',
        clip_url: postbridge_media_url || `pb://media/${postbridge_media_id}`,
        source_video: postbridge_media_url || '',
        suggested_caption: caption || '',
        category: category || 'PostBridge',
        category_emoji: '📱',
        status: 'pending_review',
        post_status: 'not_posted',
        postbridge_post_id: postbridgePostId,
        user_id: user.id,
      });
      return res.status(201).json({ clip });
    } catch (error) {
      console.error('Error creating PostBridge draft:', error.message);
      const msg = error.response?.data?.message || error.message;
      return res.status(500).json({ error: `Failed to create draft: ${msg}` });
    }
  }

  if (req.method === 'PUT') {
    const { clip_id, title, clip_url, category, caption, account_ids } = req.body;
    if (!clip_id) return res.status(400).json({ error: 'clip_id is required' });
    try {
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (clip_url !== undefined) { updates.clip_url = clip_url; updates.source_video = clip_url; }
      if (category !== undefined) updates.category = category;
      if (caption !== undefined) updates.suggested_caption = caption;

      // If PostBridge draft, also patch the post
      const existingClip = await getClip(clip_id);
      if (existingClip?.postbridge_post_id && (caption !== undefined || account_ids !== undefined)) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            const { data: setting } = await supabase.from('settings').select('value').eq('user_id', user.id).eq('key', 'postbridge_api_key').single();
            if (setting?.value) {
              const patchBody = {};
              if (caption !== undefined) patchBody.caption = caption;
              if (account_ids !== undefined) patchBody.social_accounts = account_ids;
              await axios.patch(
                `https://api.post-bridge.com/v1/posts/${existingClip.postbridge_post_id}`,
                patchBody,
                { headers: { Authorization: `Bearer ${setting.value}`, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      }

      const updatedClip = await updateClip(clip_id, updates);
      return res.status(200).json({ clip: updatedClip });
    } catch (error) {
      console.error('Error updating clip:', error.response?.data || error.message);
      const msg = error.response?.data?.message || error.message;
      return res.status(500).json({ error: `Failed to update clip: ${msg}` });
    }
  }

  if (req.method === 'DELETE') {
    const { clip_id } = req.body;
    if (!clip_id) return res.status(400).json({ error: 'clip_id is required' });
    try {
      // Revert PostBridge post to draft (preserves the media)
      const clip = await getClip(clip_id);
      if (clip?.postbridge_post_id) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            const { data: setting } = await supabase.from('settings').select('value').eq('user_id', user.id).eq('key', 'postbridge_api_key').single();
            if (setting?.value) {
              await axios.patch(
                `https://api.post-bridge.com/v1/posts/${clip.postbridge_post_id}`,
                { is_draft: true },
                { headers: { Authorization: `Bearer ${setting.value}`, 'Content-Type': 'application/json' } }
              ).catch(err => console.error('PostBridge revert-to-draft error:', err.response?.data || err.message));
            }
          }
        }
      }
      // Move to rejected locally instead of hard-deleting
      await updateClip(clip_id, { status: 'rejected' });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error removing clip:', error);
      return res.status(500).json({ error: 'Failed to remove clip' });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Public access - no auth required
  const userId = null;

  const { filter, category, sortBy } = req.query;

  try {
    let clips;

    switch (filter) {
      case 'pending':
        clips = await getPendingClips(userId);
        break;
      case 'approved':
        clips = await getApprovedClips(userId);
        break;
      case 'published':
        clips = await getPublishedClips(userId);
        break;
      case 'rejected':
        clips = await getRejectedClips(userId);
        break;
      case 'all':
        clips = await getAllClips(userId);
        break;
      default:
        clips = await getPendingClips(userId);
    }

    // Filter by category if specified
    if (category && category !== 'all') {
      clips = clips.filter(c => c.category === category);
    }

    // Sort clips
    if (sortBy) {
      switch (sortBy) {
        case 'viral_score':
          clips.sort((a, b) => parseFloat(b.viral_score) - parseFloat(a.viral_score));
          break;
        case 'duration':
          clips.sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0));
          break;
        case 'date_desc':
          clips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
        case 'date_asc':
          clips.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          break;
        default:
          clips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    }

    const stats = await getStats(userId);
    const categories = await getCategories(userId);

    return res.status(200).json({
      clips,
      stats,
      categories
    });
  } catch (error) {
    console.error('Error fetching clips:', error);
    return res.status(500).json({ error: 'Failed to fetch clips' });
  }
}
