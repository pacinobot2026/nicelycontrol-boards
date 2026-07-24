/**
 * Seed script: Import businesses.json data into Supabase for a specific user.
 *
 * Usage:
 *   node scripts/seed-businesses.js
 */

// NOTE: this file used to set NODE_TLS_REJECT_UNAUTHORIZED = '0', which turns
// off certificate validation for the entire Node process. getPgClient() scopes
// the relaxed TLS setting to this one database connection instead.

const fs = require('fs');
const path = require('path');
const { getPgClient } = require('./lib/supabase-env');

const USER_ID = '08dee908-d31b-4c19-ae7d-227ccbb068cf';
const DATA_FILE = path.join(__dirname, '..', 'data', 'businesses.json');

const client = getPgClient();

async function seed() {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const businesses = raw.businesses || [];

  await client.connect();
  console.log('Connected to database');

  for (const biz of businesses) {
    // 1. Insert business
    const bizRes = await client.query(
      `INSERT INTO businesses (user_id, name, columns, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)
       RETURNING id`,
      [USER_ID, biz.name, JSON.stringify(biz.columns), biz.createdAt]
    );
    const bizId = bizRes.rows[0].id;
    console.log(`Business "${biz.name}" created: ${bizId}`);

    // 2. Insert cards
    const cards = biz.cards || [];
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      await client.query(
        `INSERT INTO business_cards (user_id, business_id, title, description, column_name, labels, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
        [
          USER_ID,
          bizId,
          c.title,
          c.description || '',
          c.column,
          JSON.stringify(c.labels || []),
          i,
          c.createdAt,
        ]
      );
    }
    console.log(`  ${cards.length} cards inserted`);

    // 3. Insert resources
    const resources = biz.resources || [];
    for (const r of resources) {
      await client.query(
        `INSERT INTO business_resources (user_id, business_id, title, url, type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [USER_ID, bizId, r.title, r.url || '', r.type || 'link', r.createdAt]
      );
    }
    console.log(`  ${resources.length} resources inserted`);
  }

  await client.end();
  console.log('\nSeed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  client.end();
  process.exit(1);
});
