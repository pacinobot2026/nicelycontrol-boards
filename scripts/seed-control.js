process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const CHAD_USER_ID = '08dee908-d31b-4c19-ae7d-227ccbb068cf';
const DB_URL = 'postgres://postgres.jqqvqdjxviqnsgpxcgfs:HUxTv6nSBmk9y1Qm@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // Create tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS cc_api_keys (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_masked TEXT,
      status TEXT DEFAULT 'connected',
      spent NUMERIC DEFAULT 0,
      budget NUMERIC DEFAULT 0,
      position INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS cc_models (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      provider TEXT,
      status TEXT DEFAULT 'available',
      position INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS cc_cron_jobs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      schedule TEXT,
      status TEXT DEFAULT 'active',
      position INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS cc_tasks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      priority TEXT DEFAULT 'med',
      task_status TEXT DEFAULT 'backlog',
      position INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS cc_channels (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      subtitle TEXT,
      type TEXT,
      status TEXT DEFAULT 'connected',
      position INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS cc_integrations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_masked TEXT,
      status TEXT DEFAULT 'connected',
      position INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS cc_features (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      position INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  console.log('Tables ready');

  // Clear existing data for Chad
  await client.query(`DELETE FROM cc_api_keys WHERE user_id=$1`, [CHAD_USER_ID]);
  await client.query(`DELETE FROM cc_models WHERE user_id=$1`, [CHAD_USER_ID]);
  await client.query(`DELETE FROM cc_cron_jobs WHERE user_id=$1`, [CHAD_USER_ID]);
  await client.query(`DELETE FROM cc_tasks WHERE user_id=$1`, [CHAD_USER_ID]);
  await client.query(`DELETE FROM cc_channels WHERE user_id=$1`, [CHAD_USER_ID]);
  await client.query(`DELETE FROM cc_integrations WHERE user_id=$1`, [CHAD_USER_ID]);
  await client.query(`DELETE FROM cc_features WHERE user_id=$1`, [CHAD_USER_ID]);
  console.log('Cleared existing data');

  // Seed API Keys
  const apiKeys = [
    { name: 'Anthropic', key_masked: 'ab-ant-****slTgIA', status: 'connected', spent: 12.47, budget: 10.00, position: 1 },
    { name: 'Moonshot', key_masked: 'ab-****36e9', status: 'connected', spent: 3.20, budget: 20.00, position: 2 },
    { name: 'OpenAI', key_masked: 'ab-*****Qp2e', status: 'connected', spent: 1.85, budget: 10.00, position: 3 },
  ];
  for (const k of apiKeys) {
    await client.query(
      `INSERT INTO cc_api_keys (user_id, name, key_masked, status, spent, budget, position) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [CHAD_USER_ID, k.name, k.key_masked, k.status, k.spent, k.budget, k.position]
    );
  }
  console.log('Seeded api_keys:', apiKeys.length);

  // Seed Models
  const models = [
    { name: 'Claude Opus 4.5', provider: 'Anthropic', status: 'active', position: 1 },
    { name: 'Kimi K2.5', provider: 'Moonshot', status: 'active', position: 2 },
    { name: 'Kimi K2 Thinking', provider: 'Moonshot', status: 'available', position: 3 },
    { name: 'Claude Sonnet 3.5', provider: 'Anthropic', status: 'available', position: 4 },
    { name: 'Claude Haiku 3.5', provider: 'Anthropic', status: 'available', position: 5 },
  ];
  for (const m of models) {
    await client.query(
      `INSERT INTO cc_models (user_id, name, provider, status, position) VALUES ($1,$2,$3,$4,$5)`,
      [CHAD_USER_ID, m.name, m.provider, m.status, m.position]
    );
  }
  console.log('Seeded models:', models.length);

  // Seed Cron Jobs
  const cronJobs = [
    { name: 'Morning Briefing', schedule: '8:00 AM Daily', status: 'active', position: 1 },
    { name: 'Health Check', schedule: '10am & 4pm', status: 'active', position: 2 },
    { name: 'Heartbeat Poll', schedule: 'Every 30min', status: 'active', position: 3 },
    { name: 'Memory Backup', schedule: 'Daily 2am', status: 'active', position: 4 },
    { name: 'Email Watch', schedule: 'Real-time', status: 'active', position: 5 },
    { name: 'Update Check', schedule: 'Weekly', status: 'paused', position: 6 },
  ];
  for (const j of cronJobs) {
    await client.query(
      `INSERT INTO cc_cron_jobs (user_id, name, schedule, status, position) VALUES ($1,$2,$3,$4,$5)`,
      [CHAD_USER_ID, j.name, j.schedule, j.status, j.position]
    );
  }
  console.log('Seeded cron_jobs:', cronJobs.length);

  // Seed Tasks
  const tasks = [
    { title: 'OpenClaw webinar', priority: 'high', task_status: 'in_progress', position: 1 },
    { title: 'OpenClaw containers (Gaurav & Pranay)', priority: 'high', task_status: 'backlog', position: 2 },
    { title: 'Brian Anderson NDA offer', priority: 'high', task_status: 'backlog', position: 3 },
    { title: 'OpenClaw ads', priority: 'high', task_status: 'backlog', position: 4 },
    { title: 'JV script for Zoo launch', priority: 'med', task_status: 'backlog', position: 5 },
    { title: 'Model switching command', priority: 'low', task_status: 'done', position: 6 },
    { title: 'Dashboard redesign', priority: 'low', task_status: 'done', position: 7 },
  ];
  for (const t of tasks) {
    await client.query(
      `INSERT INTO cc_tasks (user_id, title, priority, task_status, position) VALUES ($1,$2,$3,$4,$5)`,
      [CHAD_USER_ID, t.title, t.priority, t.task_status, t.position]
    );
  }
  console.log('Seeded tasks:', tasks.length);

  // Seed Channels
  const channels = [
    { name: 'Telegram', subtitle: 'Primary', type: 'messaging', status: 'connected', position: 1 },
    { name: 'Discord', subtitle: 'Community', type: 'messaging', status: 'connected', position: 2 },
  ];
  for (const c of channels) {
    await client.query(
      `INSERT INTO cc_channels (user_id, name, subtitle, type, status, position) VALUES ($1,$2,$3,$4,$5,$6)`,
      [CHAD_USER_ID, c.name, c.subtitle, c.type, c.status, c.position]
    );
  }
  console.log('Seeded channels:', channels.length);

  // Seed Integrations
  const integrations = [
    { name: 'Zoom', key_masked: 'py1****sk2', status: 'connected', position: 1 },
    { name: 'Vimeo', key_masked: 'BF3****p51', status: 'connected', position: 2 },
    { name: 'MintBird / PopLinks', key_masked: 'alt*****', status: 'connected', position: 3 },
    { name: 'Global Control', key_masked: 'pk-****6/6', status: 'connected', position: 4 },
  ];
  for (const i of integrations) {
    await client.query(
      `INSERT INTO cc_integrations (user_id, name, key_masked, status, position) VALUES ($1,$2,$3,$4,$5)`,
      [CHAD_USER_ID, i.name, i.key_masked, i.status, i.position]
    );
  }
  console.log('Seeded integrations:', integrations.length);

  // Seed Features
  const features = [
    { name: 'Auto Model Selection', position: 1 },
    { name: 'Memory Persistence', position: 2 },
    { name: 'Kanban Integration', position: 3 },
    { name: 'Browser Automation', position: 4 },
    { name: 'Skill System', position: 5 },
    { name: 'Cron Scheduling', position: 6 },
  ];
  for (const f of features) {
    await client.query(
      `INSERT INTO cc_features (user_id, name, position) VALUES ($1,$2,$3)`,
      [CHAD_USER_ID, f.name, f.position]
    );
  }
  console.log('Seeded features:', features.length);

  console.log('\n=== Control page data seeded for Chad ===');
  await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
