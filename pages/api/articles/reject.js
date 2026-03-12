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

    // Update article status to rejected in Letterman
    await axios.put(
      `https://api.letterman.ai/api/newsletters/${articleId}`,
      { status: 'rejected' },
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
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (supabaseError) {
      console.error('Error updating Supabase:', supabaseError.message);
      // Don't fail the whole request if Supabase update fails
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error rejecting article:', error);
    return res.status(500).json({ error: 'Failed to reject article' });
  }
}
