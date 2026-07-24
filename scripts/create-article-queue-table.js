const { getSupabaseClient } = require('./lib/supabase-env');


const supabase = getSupabaseClient();

async function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS article_queue (
      id BIGSERIAL PRIMARY KEY,
      number INT,
      title TEXT NOT NULL,
      headline TEXT,
      type TEXT,
      priority TEXT,
      status TEXT DEFAULT 'pending',
      word_count INT,
      key_points TEXT,
      angle TEXT,
      sources TEXT,
      publication TEXT,
      letterman_article_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('✅ article_queue table created successfully');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createTable();
