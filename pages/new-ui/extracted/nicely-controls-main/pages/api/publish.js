import { getApprovedClips, updateClip } from '../../lib/storage';
import axios from 'axios';

const POSTBRIDGE_API_KEY = process.env.POSTBRIDGE_API_KEY;
const POSTBRIDGE_BASE = 'https://api.post-bridge.com/v1';

export default async function handler(req, res) {
  // Password protection removed - public access

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const approvedClips = await getApprovedClips();
    
    if (approvedClips.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No approved clips to publish',
        published: 0
      });
    }

    const results = [];

    for (const clip of approvedClips) {
      try {
        // Step 1: Download video from Vizard URL
        const videoResponse = await axios.get(clip.clip_url, {
          responseType: 'arraybuffer'
        });
        
        const videoBuffer = Buffer.from(videoResponse.data);
        
        // Step 2: Upload to Post Bridge
        const formData = new FormData();
        const blob = new Blob([videoBuffer], { type: 'video/mp4' });
        formData.append('file', blob, `${clip.clip_id}.mp4`);
        
        const uploadResponse = await axios.post(
          `${POSTBRIDGE_BASE}/media`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${POSTBRIDGE_API_KEY}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        const mediaId = uploadResponse.data.id;
        
        // Step 3: Get social accounts (we'll publish to all active ones)
        const accountsResponse = await axios.get(
          `${POSTBRIDGE_BASE}/social-accounts?limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${POSTBRIDGE_API_KEY}`
            }
          }
        );
        
        const activeAccounts = accountsResponse.data.data.filter(
          a => a.status === 'active'
        );
        
        // Step 4: Create post for each active account
        for (const account of activeAccounts) {
          await axios.post(
            `${POSTBRIDGE_BASE}/posts`,
            {
              content: clip.suggested_caption || clip.title,
              media_ids: [mediaId],
              social_account_ids: [account.id],
              status: 'published'
            },
            {
              headers: {
                'Authorization': `Bearer ${POSTBRIDGE_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        // Update clip status
        await updateClip(clip.clip_id, {
          post_status: 'published',
          published_at: new Date().toISOString(),
          published_to_platforms: activeAccounts.map(a => a.platform).join(', ')
        });
        
        results.push({
          clip_id: clip.clip_id,
          success: true,
          platforms: activeAccounts.map(a => a.platform)
        });
        
      } catch (error) {
        console.error(`Error publishing clip ${clip.clip_id}:`, error);
        results.push({
          clip_id: clip.clip_id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return res.status(200).json({
      success: true,
      published: successCount,
      total: approvedClips.length,
      results
    });
    
  } catch (error) {
    console.error('Error publishing clips:', error);
    return res.status(500).json({ error: 'Failed to publish clips' });
  }
}

