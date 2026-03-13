const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.jqqvqdjxviqnsgpxcgfs',
  password: 'HUxTv6nSBmk9y1Qm',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createVaultTable() {
  try {
    console.log('Connecting to Supabase Postgres...');
    await client.connect();
    console.log('Connected!');
    
    console.log('Creating vault_items table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS vault_items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        resource_url TEXT,
        file_path TEXT,
        notes TEXT,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client.query(createTableSQL);
    console.log('✅ Table created!');
    
    console.log('Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vault_category ON vault_items(category);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vault_type ON vault_items(type);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vault_created ON vault_items(created_at DESC);');
    console.log('✅ Indexes created!');
    
    // Check if table is empty
    console.log('Checking if table is empty...');
    const countResult = await client.query('SELECT COUNT(*) FROM vault_items');
    const count = parseInt(countResult.rows[0].count);
    
    console.log(`Table has ${count} items.`);
    
    console.log('\n🎉 Vault database setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createVaultTable();
