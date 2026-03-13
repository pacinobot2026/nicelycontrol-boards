const axios = require('axios');
const fs = require('fs');
const path = require('path');

const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
const VIMEO_USER_ID = process.env.VIMEO_USER_ID;
const VIZARD_API_KEY = process.env.VIZARD_API_KEY;

const STATE_FILE = path.join(__dirname, '..', 'data', 'monitor-state.json');
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Load last check state
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading state:', err);
  }
  return { lastCheckTime: null, processedVideos: [] };
}

// Save state
function saveState(state) {
  try {
    const dataDir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

// Get videos from Vimeo
async function getVimeoVideos() {
  try {
    const response = await axios.get(
      `https://api.vimeo.com/users/${VIMEO_USER_ID}/videos`,
      {
        headers: {
          'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`
        },
        params: {
          per_page: 50,
          sort: 'date',
          direction: 'desc'
        }
      }
    );

    return response.data.data.map(video => ({
      id: video.uri.split('/').pop(),
      title: video.name,
      url: video.link,
      created_time: video.created_time
    }));
  } catch (error) {
    console.error('Error fetching Vimeo videos:', error.message);
    return [];
  }
}

// Submit video to Vizard
async function submitToVizard(videoUrl, videoTitle) {
  try {
    console.log(`Submitting to Vizard: ${videoTitle}`);
    
    const response = await axios.post(
      'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create',
      {
        lang: 'en',
        preferLength: [1, 2], // 0-60 second clips
        videoUrl: videoUrl,
        videoType: 4, // Vimeo
        maxClipNumber: 10,
        projectName: videoTitle
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'VIZARDAI_API_KEY': VIZARD_API_KEY
        }
      }
    );

    if (response.data.code === 2000) {
      console.log(`✓ Vizard project created: ${response.data.projectId}`);
      return {
        success: true,
        projectId: response.data.projectId,
        shareLink: response.data.shareLink
      };
    } else {
      console.error(`✗ Vizard error: ${response.data.errMsg}`);
      return { success: false, error: response.data.errMsg };
    }
  } catch (error) {
    console.error('Error submitting to Vizard:', error.message);
    return { success: false, error: error.message };
  }
}

// Main monitor loop
async function monitor() {
  console.log('🔍 Checking for new Vimeo videos...');
  
  const state = loadState();
  const videos = await getVimeoVideos();
  
  if (videos.length === 0) {
    console.log('No videos found');
    return;
  }

  let newVideosFound = 0;

  for (const video of videos) {
    // Skip if already processed
    if (state.processedVideos.includes(video.id)) {
      continue;
    }

    console.log(`\n📹 New video detected: ${video.title}`);
    
    // Submit to Vizard
    const result = await submitToVizard(video.url, video.title);
    
    if (result.success) {
      // Mark as processed
      state.processedVideos.push(video.id);
      newVideosFound++;
      
      // Start polling for this project (run in background)
      setTimeout(() => {
        const { pollVizardProject } = require('./vizard-processor');
        pollVizardProject(result.projectId, video.title);
      }, 0);
    }
  }

  if (newVideosFound > 0) {
    console.log(`\n✅ Processed ${newVideosFound} new videos`);
    state.lastCheckTime = new Date().toISOString();
    saveState(state);
  } else {
    console.log('No new videos to process');
  }
}

// Run immediately, then repeat
monitor();
setInterval(monitor, CHECK_INTERVAL);

console.log(`🎬 Vimeo monitor started (checking every ${CHECK_INTERVAL / 1000 / 60} minutes)`);
