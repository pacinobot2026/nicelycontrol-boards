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

  // GET - list posts
  if (req.method === 'GET') {
    const { status, platform, format } = req.query;
    let query = supabase
      .from('social_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (format) query = query.eq('format', format);
    if (platform) query = query.contains('platforms', [platform]);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ posts: data, total: data.length });
  }

  // POST - create post
  if (req.method === 'POST') {
    const {
      title, description, image_url, video_url, caption,
      platforms, format, source, source_id, viral_score,
      platform_captions, tags, scheduled_at
    } = req.body;

    if (!title) return res.status(400).json({ error: 'title is required' });

    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        image_url: image_url || null,
        video_url: video_url || null,
        caption: caption || null,
        platforms: platforms || [],
        format: format || 'image',
        status: 'pending',
        source: source || null,
        source_id: source_id || null,
        viral_score: viral_score || null,
        platform_captions: platform_captions || {},
        tags: tags || [],
        scheduled_at: scheduled_at || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // PUT - update post (status, caption, schedule, etc.)
  if (req.method === 'PUT') {
    const { id, action, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    // Special actions
    if (action === 'approve') {
      updates.status = 'approved';
    } else if (action === 'reject') {
      updates.status = 'rejected';
    } else if (action === 'publish') {
      updates.status = 'published';
      updates.published_at = new Date().toISOString();
    }

    delete updates.user_id;
    delete updates.created_at;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('social_posts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // DELETE
  if (req.method === 'DELETE') {
    const id = req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
