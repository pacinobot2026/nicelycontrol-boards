import { supabase } from '../../../lib/supabase';

async function getLettermanKey(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('user_id', user.id)
          .eq('key', 'letterman_api_key')
          .single();
        if (data?.value) return data.value;
      }
    }
  } catch (err) {}
  return process.env.LETTERMAN_API_KEY || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'Article ID required' });
    }

    const LETTERMAN_API_KEY = await getLettermanKey(req);

    if (!LETTERMAN_API_KEY) {
      return res.status(500).json({ error: 'Letterman API key not configured' });
    }

    // Correct base URL per Letterman docs: https://api.letterman.ai/api/ai
    const lettermanRes = await fetch(
      `https://api.letterman.ai/api/ai/newsletters/${articleId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${LETTERMAN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      }
    );

    if (!lettermanRes.ok) {
      const err = await lettermanRes.text();
      console.error('Letterman approve error:', lettermanRes.status, err);
      return res.status(lettermanRes.status).json({ error: 'Letterman API error', detail: err });
    }

    // Also update in Supabase
    const { error: supabaseError } = await supabase
      .from('articles')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId);

    if (supabaseError) {
      console.error('Error updating Supabase:', supabaseError.message);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error approving article:', error);
    return res.status(500).json({ error: 'Failed to approve article' });
  }
}
