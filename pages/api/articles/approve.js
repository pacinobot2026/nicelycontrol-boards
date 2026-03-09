import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { articleId } = req.body;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID required' });
    }

    // Get article from Supabase
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (fetchError || !article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Update status to approved in Supabase
    const { error: updateError } = await supabase
      .from('articles')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (updateError) {
      console.error('Error updating Supabase:', updateError.message);
      return res.status(500).json({ error: 'Failed to update article status' });
    }

    // Send wake event to OpenClaw
    const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:18789';
    const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

    if (GATEWAY_TOKEN) {
      try {
        await fetch(`${GATEWAY_URL}/api/cron/wake`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GATEWAY_TOKEN}`
          },
          body: JSON.stringify({
            text: `🆕 Article approved and ready to process! Article ID: ${articleId}, Title: ${article.title}`,
            mode: 'now'
          })
        });
      } catch (wakeError) {
        console.error('Failed to send wake event:', wakeError);
        // Don't fail the request if wake fails
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error approving article:', error);
    return res.status(500).json({ error: 'Failed to approve article' });
  }
}
