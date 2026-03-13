const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  if (line.trim().startsWith('#') || !line.trim()) return;
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    value = value.replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const schema = `
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publication TEXT NOT NULL,
  publication_id TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  url_path TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  letterman_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_articles_publication_id ON articles(publication_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
`;

async function createTable() {
  console.log('📋 Creating articles table via Supabase SQL API...\n');

  try {
    // Use Supabase Management API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query: schema }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', error);
      throw new Error('Failed to create table');
    }

    console.log('✅ Table created successfully!\n');
    console.log('Now run: node scripts/populate-articles.js');

  } catch (err) {
    console.error('\n❌ Automatic creation failed:', err.message);
    console.log('\n📝 Please run this SQL manually in Supabase dashboard:');
    console.log('   Dashboard → SQL Editor → New Query → Paste & Run\n');
    console.log(schema);
  }
}

createTable();
