// Fetches fresh URLs from Vizard API for project 28639054 and updates the DB.
// Run: node scripts/update-vizard-urls.js

const path = require('path');
const fs = require('fs');
const https = require('https');

// Manually load .env.local
const envFile = path.join(__dirname, '../.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
  });
}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VIZARD_API_KEY = process.env.VIZARD_API_KEY || 'a3ceb9b1e62a49a9a101923472724ea9';
const PROJECT_ID = 28639054;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function fetchVizardVideos() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'elb-api.vizard.ai',
      path: `/hvizard-server-front/open-api/v1/project/query/${PROJECT_ID}`,
      method: 'GET',
      headers: { 'VIZARDAI_API_KEY': VIZARD_API_KEY },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log(`Fetching fresh URLs from Vizard API for project ${PROJECT_ID}...`);
  const vizardData = await fetchVizardVideos();

  if (!vizardData.videos || !Array.isArray(vizardData.videos)) {
    console.error('Unexpected Vizard API response:', vizardData);
    process.exit(1);
  }

  console.log(`Got ${vizardData.videos.length} videos from Vizard\n`);

  for (const video of vizardData.videos) {
    const clipId = String(video.videoId);
    const freshUrl = video.videoUrl;

    if (!freshUrl) {
      console.log(`SKIP: videoId=${clipId} — no videoUrl`);
      continue;
    }

    const { data, error } = await supabase
      .from('clips')
      .update({
        clip_url: freshUrl,
        source_video: freshUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('clip_id', clipId)
      .select('clip_id, title');

    if (error) {
      console.error(`ERROR updating clip_id=${clipId}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✓ Updated: "${data[0].title}" (clip_id=${clipId})`);
    } else {
      console.log(`NOT FOUND in DB: clip_id=${clipId} ("${video.title}")`);
    }
  }

  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
