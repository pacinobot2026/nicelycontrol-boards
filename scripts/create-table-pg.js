const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local
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

const connectionString = envVars.POSTGRES_URL_NON_POOLING;

// Disable SSL verification for Node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function createTable() {
  const client = new Client({ 
    connectionString
  });

  try {
    console.log('📋 Connecting to Supabase Postgres...\n');
    await client.connect();

    console.log('✅ Connected! Creating articles table...\n');

    await client.query(`
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
    `);

    console.log('✅ Table created!\n');
    console.log('Creating indexes...\n');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_publication_id ON articles(publication_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
    `);

    console.log('✅ Indexes created!\n');
    console.log('🎉 Setup complete! Now run: node scripts/populate-articles.js');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

createTable();
