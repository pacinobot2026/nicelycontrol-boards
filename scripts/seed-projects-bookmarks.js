process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const CHAD_USER_ID = '08dee908-d31b-4c19-ae7d-227ccbb068cf';
const DB_URL = 'postgres://postgres.jqqvqdjxviqnsgpxcgfs:HUxTv6nSBmk9y1Qm@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

const projects = [
  { title: 'Titanium AI Platform', description: 'Core AI assistant platform powering all Nicely Control automation workflows and team operations.', category: 'AI / Automation', status: 'active', tags: ['ai', 'automation', 'core'] },
  { title: 'ChadNicely.com Rebrand', description: 'Full website redesign and rebrand including new content strategy, lead capture funnels, and updated sales pages.', category: 'Marketing', status: 'active', tags: ['website', 'branding', 'funnel'] },
  { title: 'Email Reactivation Campaign', description: 'Progressive 90-day reactivation sequence targeting 45k inactive subscribers using segmented CSV uploads.', category: 'Email Marketing', status: 'active', tags: ['email', 'reactivation', 'global-control'] },
  { title: 'Course Sprout Expansion', description: 'Adding 12 new modules to Titanium membership including VSL creation, AI avatar, and workflow automation courses.', category: 'Courses', status: 'active', tags: ['courses', 'content', 'membership'] },
  { title: 'NicelyControl Boards Dashboard', description: 'Internal team dashboard with kanban, article management, bookmarks, vault, and AI command center.', category: 'Internal Tools', status: 'active', tags: ['dashboard', 'internal', 'next.js'] },
  { title: 'PopLinks 2.0 Integration', description: 'Deep integration of PopLinks shortener and lead capture pages into the Titanium workflow system.', category: 'Integrations', status: 'active', tags: ['poplinks', 'mintbird', 'integration'] },
  { title: 'VSL Production Pipeline', description: 'Automated VSL creation using ElevenLabs voice, Whisper transcription, and FFmpeg video compilation.', category: 'AI / Automation', status: 'planning', tags: ['vsl', 'elevenlabs', 'ffmpeg'] },
  { title: 'Global Control API Sync', description: 'Real-time sync between Global Control CRM and the dashboard for contacts, tags, and email stats.', category: 'Integrations', status: 'planning', tags: ['crm', 'global-control', 'api'] },
  { title: 'Vimeo Clip Automation', description: 'Auto-process Vimeo uploads through Vizard AI for social media clips and post to connected accounts.', category: 'AI / Automation', status: 'completed', tags: ['vimeo', 'vizard', 'social'] },
  { title: 'Supabase Migration', description: 'Migrated all board data from Vercel KV to Supabase PostgreSQL with user-scoped access control.', category: 'Internal Tools', status: 'completed', tags: ['supabase', 'database', 'migration'] },
];

const bookmarks = [
  { title: 'Supabase Docs - Row Level Security', url: 'https://supabase.com/docs/guides/auth/row-level-security', description: 'Complete guide to setting up RLS policies for user-scoped data access.', category: 'Development', status: 'favorites', tags: ['supabase', 'rls', 'security'] },
  { title: 'ElevenLabs API Reference', url: 'https://elevenlabs.io/docs/api-reference', description: 'API docs for voice cloning and text-to-speech generation.', category: 'AI Tools', status: 'favorites', tags: ['elevenlabs', 'tts', 'voice'] },
  { title: 'Vercel KV Documentation', url: 'https://vercel.com/docs/storage/vercel-kv', description: 'Redis-compatible key-value store for serverless apps on Vercel.', category: 'Development', status: 'read-later', tags: ['vercel', 'kv', 'redis'] },
  { title: 'HeyGen AI Video Platform', url: 'https://www.heygen.com', description: 'AI avatar video generation platform for creating spokesperson videos at scale.', category: 'AI Tools', status: 'favorites', tags: ['heygen', 'avatar', 'video'] },
  { title: 'DND Kit Documentation', url: 'https://dndkit.com', description: 'Modern drag and drop toolkit for React used in the kanban board.', category: 'Development', status: 'favorites', tags: ['react', 'dnd', 'kanban'] },
  { title: 'Vizard AI - Video Clipping', url: 'https://vizard.ai', description: 'AI-powered video clipping tool that auto-generates short clips from long-form content.', category: 'AI Tools', status: 'favorites', tags: ['vizard', 'clips', 'ai'] },
  { title: 'FFmpeg Documentation', url: 'https://ffmpeg.org/documentation.html', description: 'Complete FFmpeg docs for video processing, encoding, and compilation pipelines.', category: 'Development', status: 'read-later', tags: ['ffmpeg', 'video', 'encoding'] },
  { title: 'Next.js 14 App Router Guide', url: 'https://nextjs.org/docs/app', description: 'Official guide for Next.js 14 App Router patterns and best practices.', category: 'Development', status: 'read-later', tags: ['nextjs', 'react', 'routing'] },
  { title: 'PostBridge API Docs', url: 'https://postbridge.io/docs', description: 'API reference for uploading and publishing video content to social media accounts.', category: 'Integrations', status: 'read-later', tags: ['postbridge', 'social', 'publishing'] },
  { title: 'EmailListVerify Service', url: 'https://emaillistverify.com', description: 'Bulk email verification service used in the reactivation campaign workflow.', category: 'Email Marketing', status: 'archived', tags: ['email', 'verification', 'list'] },
  { title: 'Tailwind CSS Components', url: 'https://tailwindui.com/components', description: 'Premium Tailwind UI component library for building modern interfaces.', category: 'Development', status: 'read-later', tags: ['tailwind', 'ui', 'components'] },
  { title: 'OpenAI Whisper Model', url: 'https://openai.com/research/whisper', description: 'Open-source speech recognition model used for generating VSL transcripts.', category: 'AI Tools', status: 'archived', tags: ['whisper', 'transcription', 'openai'] },
];

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // Ensure tables exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      status TEXT DEFAULT 'active',
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      category TEXT,
      status TEXT DEFAULT 'read-later',
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Tables ready');

  // Check existing counts
  const existingProjects = await client.query('SELECT count(*) FROM projects WHERE user_id=$1', [CHAD_USER_ID]);
  const existingBookmarks = await client.query('SELECT count(*) FROM bookmarks WHERE user_id=$1', [CHAD_USER_ID]);
  console.log('Existing projects:', existingProjects.rows[0].count);
  console.log('Existing bookmarks:', existingBookmarks.rows[0].count);

  // Seed projects
  let pCount = 0;
  for (const p of projects) {
    await client.query(
      `INSERT INTO projects (user_id, title, description, category, status, tags)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [CHAD_USER_ID, p.title, p.description, p.category, p.status, p.tags]
    );
    pCount++;
  }
  console.log('Seeded projects:', pCount);

  // Seed bookmarks
  let bCount = 0;
  for (const b of bookmarks) {
    await client.query(
      `INSERT INTO bookmarks (user_id, title, url, description, category, status, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [CHAD_USER_ID, b.title, b.url, b.description, b.category, b.status, b.tags]
    );
    bCount++;
  }
  console.log('Seeded bookmarks:', bCount);

  // Final counts
  const fp = await client.query('SELECT count(*) FROM projects WHERE user_id=$1', [CHAD_USER_ID]);
  const fb = await client.query('SELECT count(*) FROM bookmarks WHERE user_id=$1', [CHAD_USER_ID]);
  const fc = await client.query('SELECT count(*) FROM commands WHERE user_id=$1', [CHAD_USER_ID]);
  console.log('\n=== Final counts for Chad ===');
  console.log('commands:', fc.rows[0].count);
  console.log('projects:', fp.rows[0].count);
  console.log('bookmarks:', fb.rows[0].count);

  await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
