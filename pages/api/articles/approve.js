import { supabase } from '../../../lib/supabase';
const axios = require('axios');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { articleId } = req.body;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID required' });
    }

    const LETTERMAN_API_KEY = process.env.LETTERMAN_API_KEY || '';
    
    if (!LETTERMAN_API_KEY) {
      return res.status(500).json({ error: 'Letterman API key not configured' });
    }

    // Update article status to approved in Letterman
    await axios.put(
      `https://api.letterman.ai/api/newsletters/${articleId}`,
      { status: 'approved' },
      {
        headers: {
          'Authorization': `Bearer ${LETTERMAN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Also update in Supabase
    const { error: supabaseError } = await supabase
      .from('articles')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (supabaseError) {
      console.error('Error updating Supabase:', supabaseError.message);
      // Don't fail the whole request if Supabase update fails
    }

    // Send wake notification to OpenClaw
    const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3080';
    try {
      const { data: article } = await supabase
        .from('articles')
        .select('id, title, publication')
        .eq('id', articleId)
        .single();
      
      if (article) {
        await axios.post(
          `${GATEWAY_URL}/api/v1/cron/wake`,
          {
            text: `📰 Article approved: "${article.title}" (${article.publication || 'Unknown publication'}) - Article ID: ${articleId}`,
            mode: 'now'
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          }
        );
      }
    } catch (wakeError) {
      console.error('Failed to send wake notification:', wakeError.message);
      // Don't fail the whole request if wake fails
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error approving article:', error);
    return res.status(500).json({ error: 'Failed to approve article' });
  }
}
