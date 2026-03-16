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
        
        // Step 2: Upload to Post Bridge using signed URL flow
        const filename = `${clip.clip_id}.mp4`;
        const urlRes = await axios.post(
          `${POSTBRIDGE_BASE}/media/create-upload-url`,
          { name: filename, mime_type: 'video/mp4', size_bytes: videoBuffer.length },
          { headers: { 'Authorization': `Bearer ${POSTBRIDGE_API_KEY}`, 'Content-Type': 'application/json' } }
        );
        const { media_id: mediaId, upload_url: uploadUrl } = urlRes.data;

        // PUT the raw file to the signed URL (no auth header needed)
        await axios.put(uploadUrl, videoBuffer, {
          headers: { 'Content-Type': 'video/mp4' }
        });

        // Step 3: Get social accounts (publish to all)
        const accountsResponse = await axios.get(
          `${POSTBRIDGE_BASE}/social-accounts?limit=100`,
          { headers: { 'Authorization': `Bearer ${POSTBRIDGE_API_KEY}` } }
        );

        const accounts = accountsResponse.data.data || [];

        // Step 4: Create one post for all accounts (immediate publish)
        await axios.post(
          `${POSTBRIDGE_BASE}/posts`,
          {
            caption: clip.suggested_caption || clip.title,
            media: [mediaId],
            social_accounts: accounts.map(a => a.id),
          },
          {
            headers: {
              'Authorization': `Bearer ${POSTBRIDGE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Update clip status
        await updateClip(clip.clip_id, {
          post_status: 'published',
          published_at: new Date().toISOString(),
          published_to_platforms: accounts.map(a => a.platform).join(', ')
        });

        results.push({
          clip_id: clip.clip_id,
          success: true,
          platforms: accounts.map(a => a.platform)
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

