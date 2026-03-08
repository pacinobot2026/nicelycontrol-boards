import { supabase } from '../../../lib/supabase';
const axios = require('axios');

// Publication name to Letterman ID mapping
const PUBLICATION_IDS = {
  'West Valley Shoutouts': '677895a2584a3ce5878fcf5b',
  'Save the Doggy': '68a78eba3ce3e647df7fefaa',
  'Vegas Fork': '68a790aa3ce3e647df7ff272',
  'Summerlin Shoutouts': '66569dc96c58db7f4dfff4a5'
};

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

    // Get article from Supabase
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (fetchError || !article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Get publication ID
    const publicationId = PUBLICATION_IDS[article.publication];
    if (!publicationId) {
      return res.status(400).json({ error: `Unknown publication: ${article.publication}` });
    }

    // Create article in Letterman as DRAFT using keepOriginal mode
    const lettermanArticle = {
      storageId: publicationId,
      type: 'ARTICLE',
      articleOptions: {
        contentFrom: 'CONTENT',
        keepOriginal: true,
        headline: article.title || 'Untitled',
        subHeadline: article.seo_description || '',
        content: article.content || '<p>No content</p>',
        keywords: [],
        imageUrl: article.image_url || '',
        summary: {
          title: article.seo_title || article.title || 'Untitled',
          description: article.seo_description || '',
          imageUrl: article.image_url || '',
          content: article.content || '<p>No content</p>'
        }
      }
    };

    const lettermanResponse = await axios.post(
      'https://api.letterman.ai/api/ai/newsletters',
      lettermanArticle,
      {
        headers: {
          'Authorization': `Bearer ${LETTERMAN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const lettermanId = lettermanResponse.data?._id || lettermanResponse.data?.id;

    // Update Supabase with Letterman ID and approved status
    const { error: updateError } = await supabase
      .from('articles')
      .update({ 
        status: 'approved',
        letterman_id: lettermanId,
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (updateError) {
      console.error('Error updating Supabase:', updateError.message);
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
