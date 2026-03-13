const axios = require('axios');
const fs = require('fs');
const path = require('path');

const VIZARD_API_KEY = process.env.VIZARD_API_KEY;
const POLL_INTERVAL = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 40; // 20 minutes max

// Query Vizard project
async function queryVizardProject(projectId) {
  try {
    const response = await axios.get(
      `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/query/${projectId}`,
      {
        headers: {
          'VIZARDAI_API_KEY': VIZARD_API_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error querying Vizard:', error.message);
    return null;
  }
}

// Save clip to storage
function saveClip(clipData) {
  const clipsFile = path.join(__dirname, '..', 'data', 'clips.json');
  
  try {
    let data = { clips: [] };
    
    if (fs.existsSync(clipsFile)) {
      data = JSON.parse(fs.readFileSync(clipsFile, 'utf-8'));
    }
    
    // Check if clip already exists
    const existingIndex = data.clips.findIndex(c => c.clip_id === clipData.clip_id);
    
    if (existingIndex >= 0) {
      // Update existing
      data.clips[existingIndex] = clipData;
    } else {
      // Add new
      data.clips.push(clipData);
    }
    
    fs.writeFileSync(clipsFile, JSON.stringify(data, null, 2));
    console.log(`  ✓ Saved clip: ${clipData.clip_id}`);
  } catch (error) {
    console.error('Error saving clip:', error.message);
  }
}

// Poll Vizard project until complete
async function pollVizardProject(projectId, sourceVideoTitle) {
  console.log(`\n🔄 Polling Vizard project ${projectId}...`);
  
  let attempts = 0;
  
  const poll = async () => {
    attempts++;
    
    const result = await queryVizardProject(projectId);
    
    if (!result) {
      console.log(`  ✗ Query failed, will retry...`);
      
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, POLL_INTERVAL);
      } else {
        console.log(`  ✗ Max attempts reached for project ${projectId}`);
      }
      return;
    }
    
    if (result.code === 2000 && result.videos && result.videos.length > 0) {
      // Processing complete!
      console.log(`  ✅ Processing complete! Found ${result.videos.length} clips`);
      
      // Save each clip
      for (const video of result.videos) {
        const clipData = {
          clip_id: String(video.videoId),
          source_video_title: sourceVideoTitle,
          vizard_project_id: String(projectId),
          clip_url: video.videoUrl,
          title: video.title,
          suggested_caption: video.viralReason || video.title,
          viral_score: video.viralScore,
          transcript: video.transcript || '',
          duration_ms: video.videoMsDuration,
          status: 'pending_review',
          post_status: 'not_posted',
          created_at: new Date().toISOString()
        };
        
        saveClip(clipData);
      }
      
      console.log(`  🎬 All clips saved for project ${projectId}`);
      
    } else if (result.code === 1000) {
      // Still processing
      const elapsed = attempts * (POLL_INTERVAL / 1000);
      console.log(`  ⏳ Still processing... (${elapsed}s elapsed)`);
      
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, POLL_INTERVAL);
      } else {
        console.log(`  ⏰ Timeout reached for project ${projectId}`);
      }
      
    } else {
      console.log(`  ✗ Error code ${result.code}: ${result.errMsg || 'Unknown error'}`);
    }
  };
  
  // Start polling
  poll();
}

module.exports = { pollVizardProject, queryVizardProject };
