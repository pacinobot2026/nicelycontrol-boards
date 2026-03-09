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

    // Article status updated to "approved"
    // OpenClaw will pick it up on next heartbeat check
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error approving article:', error);
    return res.status(500).json({ error: 'Failed to approve article' });
  }
}
