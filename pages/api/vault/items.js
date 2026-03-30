import { Client } from 'pg';
import { supabase } from '../../../lib/supabase';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    return user || null;
  } catch { return null; }
}

function makeClient() {
  const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  const connectionString = raw
    .replace(/[?&]sslmode=[^&]*/g, '')
    .replace(/[?&]pgbouncer=[^&]*/g, '')
    .replace(/[?&]supa=[^&]*/g, '');
  return new Client({ connectionString, ssl: { rejectUnauthorized: false } });
}

async function withDb(fn) {
  // Bypass Node's TLS verification for Supabase's certificate chain
  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const client = makeClient();
  try {
    await client.connect();
    // Ensure table exists on every connection — safe because of IF NOT EXISTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS vault_items (
        id           SERIAL PRIMARY KEY,
        user_id      UUID REFERENCES auth.users(id),
        title        TEXT NOT NULL,
        category     TEXT NOT NULL DEFAULT 'general',
        type         TEXT NOT NULL DEFAULT 'note',
        resource_url TEXT,
        notes        TEXT DEFAULT '',
        tags         TEXT[] DEFAULT '{}',
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
    `);
    const result = await fn(client);
    await client.end();
    return result;
  } catch (err) {
    await client.end().catch(() => {});
    throw err;
  } finally {
    if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
  }
}

function toItem(row) {
  return {
    id: row.id.toString(),
    title: row.title,
    category: row.category,
    type: row.type,
    url: row.resource_url || null,
    notes: row.notes || '',
    tags: row.tags || [],
    createdAt: row.created_at,
  };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const rows = await withDb(client =>
        client.query(
          'SELECT * FROM vault_items WHERE user_id = $1 ORDER BY created_at DESC',
          [user.id]
        ).then(r => r.rows)
      );
      return res.status(200).json({ items: rows.map(toItem) });
    }

    if (req.method === 'POST') {
      const { title, category, type, url, notes, tags } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: 'title is required' });

      const row = await withDb(client =>
        client.query(
          `INSERT INTO vault_items (user_id, title, category, type, resource_url, notes, tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [user.id, title.trim(), category || 'general', type || 'note', url || null, notes || '', tags || []]
        ).then(r => r.rows[0])
      );
      return res.status(201).json({ item: toItem(row) });
    }

    if (req.method === 'PUT') {
      const { id, title, category, type, url, notes, tags } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const row = await withDb(client =>
        client.query(
          `UPDATE vault_items SET
            title = COALESCE($1, title),
            category = COALESCE($2, category),
            type = COALESCE($3, type),
            resource_url = COALESCE($4, resource_url),
            notes = COALESCE($5, notes),
            tags = COALESCE($6, tags),
            updated_at = NOW()
           WHERE id = $7 AND user_id = $8 RETURNING *`,
          [title, category, type, url, notes, tags, id, user.id]
        ).then(r => r.rows[0])
      );
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ item: toItem(row) });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      await withDb(client =>
        client.query('DELETE FROM vault_items WHERE id = $1 AND user_id = $2', [id, user.id])
      );
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error('vault/items error:', err);
    return res.status(500).json({ error: err.message });
  }
}
