process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const CHAD_USER_ID = '08dee908-d31b-4c19-ae7d-227ccbb068cf';
const DB_URL = 'postgres://postgres.jqqvqdjxviqnsgpxcgfs:HUxTv6nSBmk9y1Qm@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

const commands = [
  { name: '/idea', category: 'content', command_group: 'resources', description: 'Add idea to Idea Board with suggested category', steps: ['Ask what the idea is', 'Suggest the category', 'Create idea in board'], shortcut: null, logo: null },
  { name: '/resource', category: 'content', command_group: 'resources', description: 'Add resource to Resource Library with suggested category', steps: ['Ask what the resource is', 'Suggest the category', 'Create resource in library'], shortcut: null, logo: null },
  { name: '/create business', category: 'business', command_group: 'resources', description: 'PRODUCT CREATION ENGINE - Full 6-stage revenue mode from idea to scale', steps: ['STAGE 1: Generate 10 opportunities with scoring', 'STAGE 2: Build business blueprint', 'STAGE 3: Build product + sales page + VSL + Stripe', 'STAGE 4: Create traffic assets (organic + paid + email)', 'STAGE 5: Deploy traffic + launch ads', 'STAGE 6: Optimization + scale plan', 'Updates Business Board throughout process'], shortcut: 'Type "/create business" to start full product creation', logo: null },
  { name: '/salespage', category: 'business', command_group: 'resources', description: 'Build professional Next.js sales page and deploy to Vercel', steps: ['Ask for product name and offer details', 'Generate sales page structure', 'Create with headline, video embed, bullet points, CTA', 'Deploy to Vercel', 'Return live URL'], shortcut: null, logo: null },
  { name: '/salescopy', category: 'business', command_group: 'resources', description: 'Generate high-converting sales copy using proven frameworks', steps: ['Ask about product/offer', 'Choose framework (PAS, AIDA, etc.)', 'Generate headline, subheadline, bullets', 'Create CTA and urgency elements', 'Deliver formatted copy'], shortcut: null, logo: null },
  { name: '/vsl', category: 'business', command_group: 'resources', description: 'Create complete VSL - script, audio, and video with text slides', steps: ['Generate VSL script', "Create audio with ElevenLabs (Chad's voice)", 'Generate word-level timestamps with Whisper', 'Build text slides synced to audio', 'Compile final video with FFmpeg', 'Upload to Vimeo or return file'], shortcut: null, logo: null },
  { name: '/videoavatar', category: 'business', command_group: 'resources', description: 'Generate AI avatar video with HeyGen or ElevenLabs', steps: ['Ask for script/message', 'Choose avatar style', 'Generate with HeyGen or ElevenLabs', 'Return video URL or file'], shortcut: null, logo: null },
  { name: '/broadcast', category: 'email', command_group: 'titanium', description: 'Create and send broadcast email via Global Control', steps: ['Ask what email is about', 'Rewrite content + create subject/pre-header', 'Create PopLink for URL', 'ASK: Re-engage inactives? (YES/NO)', 'YES: Pull from GC segments (Inactive, New, Passive, Dead)', 'NO: Send test, Wait for "send it"'], shortcut: 'Type "/broadcast" or say "write me an email"', logo: '/logos/globalcontrol.png' },
  { name: '/emailstats', category: 'email', command_group: 'titanium', description: 'Get email performance stats from Global Control', steps: ['Ask: Broadcast or Workflow?', 'Ask for date or date range', 'Pull stats from GC API', 'Show: Subject, Sent, Opens, Clicks'], shortcut: null, logo: '/logos/globalcontrol.png' },
  { name: '/reactivation', category: 'email', command_group: 'titanium', description: 'Long-term progressive campaign from CSV file (not instant broadcast)', steps: ['Ask how many contacts', 'Ask pace (Mild/Normal/Aggressive)', 'Upload CSV/XLS file', 'Verify emails (EmailListVerify)', 'Choose GC tag + workflow', 'Progressive daily sending via cron jobs', 'Kanban board tracking', 'Pause/Resume/Cancel anytime'], shortcut: null, logo: '/logos/globalcontrol.png' },
  { name: '/replay', category: 'content', command_group: 'titanium', description: 'Create Course Sprout lesson from Vimeo video', steps: ['Ask for Vimeo URL', 'Ask for lesson title (or auto-generate)', 'Download transcript from Vimeo API', 'Create lesson with short + long descriptions (NO EMOJIS)', 'Add goal block (10 pts, comments, user input)', 'Defaults: Course 340, Chapter 958'], shortcut: null, logo: '/logos/coursesprout.png' },
  { name: '/article', category: 'content', command_group: 'titanium', description: 'Create Letterman article with full workflow', steps: ['Ask: Blank or AI-generated?', 'Ask: Local or Niche?', 'Ask: Word count', 'Ask: Image URL or generate?', 'If AI: Generate content from topic/URL', 'If Local: Apply local SEO strategy', 'Create as DRAFT with proper formatting', 'Update SEO settings', 'WAIT for "publish" - never auto-publish'], shortcut: null, logo: '/logos/letterman.png' },
  { name: '/poplink', category: 'links', command_group: 'titanium', description: 'Create shortened PopLink (auto-generates slug + domain)', steps: ['User gives destination URL ONLY', 'Auto-use chadnicely.com domain (ID: 1977)', 'Auto-generate simple slug', 'Create via PopLinks API', 'NEVER ask for domain or slug'], shortcut: 'Just paste the URL you want to shorten', logo: '/logos/mintbird.png' },
  { name: '/leadstep', category: 'links', command_group: 'titanium', description: 'Create lead capture page in PopLinks', steps: ['Ask for page name', 'Ask for headline/offer', 'Ask for domain (default: chadnicely.com)', 'Ask for URL slug', 'Create via PopLinks API', 'Set up confirmation page'], shortcut: null, logo: '/logos/mintbird.png' },
  { name: '/bridgepage', category: 'links', command_group: 'titanium', description: 'Create or clone bridge page in PopLinks', steps: ['Ask: Clone existing or create new?', 'If clone: Ask for source page ID/name', 'Ask for new name', 'Ask for destination URL', 'Ask for domain + slug', 'Create/clone via PopLinks API', 'Update headline, video if needed'], shortcut: null, logo: '/logos/mintbird.png' },
  { name: '/tag', category: 'contacts', command_group: 'titanium', description: 'Fire a tag on a contact in Global Control', steps: ['Ask for contact name', 'Ask for email', 'Ask which tag to fire', 'Fire tag via GC API', 'Confirm success'], shortcut: null, logo: '/logos/globalcontrol.png' },
  { name: '/bulkimport', category: 'contacts', command_group: 'titanium', description: 'Bulk import contacts from CSV and tag them (creates if needed)', steps: ['Ask for CSV file', 'Ask for tag name', 'For each contact in CSV:', '  - If exists: Fire tag (update)', '  - If new: Create contact + fire tag', 'Generate detailed report with stats', 'CSV format: email, firstName, lastName'], shortcut: null, logo: '/logos/globalcontrol.png' },
  { name: '/contact', category: 'contacts', command_group: 'titanium', description: 'Get contact history from Global Control', steps: ['Ask for contact name', 'Ask for email', 'Search GC for contact', 'Show full history: tags, emails, activity, purchases'], shortcut: null, logo: '/logos/globalcontrol.png' },
  { name: '/workflow', category: 'contacts', command_group: 'titanium', description: 'Create automated workflow in Global Control (email sequences, automations)', steps: ['Ask what the workflow should do', 'Define triggers and actions', 'Use safe pattern (Kafi-approved):', '  1. POST /workflows (create empty container)', '  2. GET /workflows/{id} (get current state)', '  3. Add flows to existing array', '  4. PUT /workflows/{id} (save complete array)', 'Critical: PUT APPENDS flows - always get current state first', 'Return workflow ID and confirmation'], shortcut: null, logo: '/logos/globalcontrol.png' },
  { name: '/sob', category: 'contacts', command_group: 'external', description: 'Look up user credentials in SaaSOnboard (access management)', steps: ['Ask for name and email', 'Ask what product they need', 'Search SOB API for email', 'Show access details if found', 'Passwords NOT available via API (security)', 'Offer to reset password (with confirmation)'], shortcut: null, logo: null },
  { name: '/makelive', category: 'system', command_group: 'external', description: 'Deploy any project to Vercel with one command', steps: ['Commit & push to GitHub', 'Ensure Vercel project connected', 'Trigger Vercel deployment via API', 'Return live URL + confirm auto-deploy enabled'], shortcut: null, logo: null },
  { name: '/systemhealth', category: 'system', command_group: 'external', description: 'Run health check on all APIs and properties', steps: ['Check 5 APIs: GC, PopLinks/MintBird, Course Sprout, Letterman, SOB', 'Check 9 URLs: Key properties', 'Save results to health-checks/YYYY-MM-DD.json', 'Report any failures', 'Runs automatically: 10 AM & 4 PM CST'], shortcut: null, logo: null },
  { name: '/teamcall', category: 'system', command_group: 'external', description: 'Extract assignments from team Zoom call and update dashboard', steps: ['Fetch latest recording (Meeting ID: 82250425529)', 'Download and parse transcript', 'Extract assignments per team member', 'Update TEAM-KANBAN.md', 'Post summary to Telegram team room'], shortcut: null, logo: null },
];

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS commands (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      command_group TEXT NOT NULL,
      description TEXT NOT NULL,
      steps JSONB NOT NULL DEFAULT '[]',
      shortcut TEXT,
      logo TEXT,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Table ready');

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    await client.query(`
      INSERT INTO commands (user_id, name, category, command_group, description, steps, shortcut, logo, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (name) DO UPDATE SET
        category=EXCLUDED.category, command_group=EXCLUDED.command_group,
        description=EXCLUDED.description, steps=EXCLUDED.steps,
        shortcut=EXCLUDED.shortcut, logo=EXCLUDED.logo, sort_order=EXCLUDED.sort_order,
        updated_at=NOW()
    `, [CHAD_USER_ID, cmd.name, cmd.category, cmd.command_group, cmd.description, JSON.stringify(cmd.steps), cmd.shortcut, cmd.logo, i]);
  }

  const { rows } = await client.query('SELECT count(*) FROM commands');
  console.log('Commands in DB:', rows[0].count);
  await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
