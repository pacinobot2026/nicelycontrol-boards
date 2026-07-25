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

    // Send the article back for revision in Letterman.
    // NOTE: Letterman's state enum has no REJECTED value. The options are
    // DRAFT | PUBLISHED | READY | SENT | NEED_APPROVAL | DONE | APPROVED |
    // REVISED | FOR_FORMATTING | FOR_REVISION | FOR_APPROVAL.
    // FOR_REVISION is the closest match to "reject / send back", but this is a
    // workflow choice — switch to DRAFT if the desired behaviour is
    // "return to the author's drafts" instead.
    await axios.put(
      `https://api.letterman.ai/newsletters/${articleId}`,
      { state: 'FOR_REVISION' },
      {
        headers: {
          'Authorization': `Bearer ${LETTERMAN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Also update in Supabase. Store the raw uppercase state so this matches what
    // the sync in ../articles.js writes (`status: article.state`).
    const { error: supabaseError } = await supabase
      .from('articles')
      .update({
        status: 'FOR_REVISION',
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (supabaseError) {
      console.error('Error updating Supabase:', supabaseError.message);
      // Don't fail the whole request if Supabase update fails
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    // Pass through Letterman's own error message when it supplies one.
    const apiMessage = error.response?.data?.error;
    if (apiMessage) {
      console.error('Letterman rejected the state change:', apiMessage);
      return res.status(error.response.status || 400).json({ error: apiMessage });
    }
    console.error('Error rejecting article:', error);
    return res.status(500).json({ error: 'Failed to reject article' });
  }
}
