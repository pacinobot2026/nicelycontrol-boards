require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('📋 Creating articles table...\n');

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

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });

    if (error) {
      // Try alternative approach - direct SQL via REST
      console.log('⚠️  RPC not available, using REST API...\n');
      
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
        throw new Error('Table creation failed. Please run the SQL manually in Supabase dashboard.');
      }
    }

    console.log('✅ Table created successfully!\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Please run this SQL manually in Supabase dashboard:\n');
    console.log(schema);
  }
}

createTable();
