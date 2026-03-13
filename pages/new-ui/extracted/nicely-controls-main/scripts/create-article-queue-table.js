const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jqqvqdjxviqnsgpxcgfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcXZxZGp4dmlxbnNncHhjZ2ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk2MjIwOSwiZXhwIjoyMDg3NTM4MjA5fQ.ibJyHrxx2TlfRbfh-9IKD3-kY9aSXAfrDJ1ZHVFijOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

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
