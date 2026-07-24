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

    // Update article state to APPROVED in Letterman.
    // The field is `state` (not `status`) and values are uppercase. Valid enum:
    // DRAFT | PUBLISHED | READY | SENT | NEED_APPROVAL | DONE | APPROVED |
    // REVISED | FOR_FORMATTING | FOR_REVISION | FOR_APPROVAL
    await axios.put(
      `https://api.letterman.ai/newsletters/${articleId}`,
      { state: 'APPROVED' },
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
        status: 'APPROVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (supabaseError) {
      console.error('Error updating Supabase:', supabaseError.message);
      // Don't fail the whole request if Supabase update fails
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    // Letterman enforces preconditions on approval — e.g. it returns 400 with
    // "Add a subject and pre-header before approving this newsletter." That's
    // actionable, so pass its message through instead of a generic 500.
    const apiMessage = error.response?.data?.error;
    if (apiMessage) {
      console.error('Letterman rejected approval:', apiMessage);
      return res.status(error.response.status || 400).json({ error: apiMessage });
    }
    console.error('Error approving article:', error);
    return res.status(500).json({ error: 'Failed to approve article' });
  }
}
