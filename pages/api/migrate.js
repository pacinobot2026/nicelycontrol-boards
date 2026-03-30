import fs from 'fs';
import path from 'path';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Runs migrations via the Supabase Management API (plain HTTPS — no SSL cert issues).
// Requires SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken = req.body?.accessToken;

  if (!supabaseUrl) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL env var.' });
  }
  if (!accessToken) {
    return res.status(400).json({ error: 'Supabase access token is required.' });
  }

  // Extract project ref: https://XXXXXXXX.supabase.co → XXXXXXXX
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const schemaFile = path.join(process.cwd(), 'supabase', 'schema.sql');

  // schema.sql first (creates base tables), numbered migrations after (alter/extend)
  let files = [];
  if (fs.existsSync(schemaFile)) {
    files.push({ name: 'schema.sql', filepath: schemaFile });
  }
  try {
    const numbered = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .map(f => ({ name: f, filepath: path.join(migrationsDir, f) }));
    files = files.concat(numbered);
  } catch {
    return res.status(500).json({ error: 'Could not read migrations folder.' });
  }

  const results = [];

  for (const { name, filepath } of files) {
    const query = fs.readFileSync(filepath, 'utf8');
    try {
      const r = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const body = await r.text();
      if (r.ok) {
        results.push({ file: name, status: 'ok' });
      } else {
        const safe = body.includes('already exists') || body.includes('does not exist');
        results.push({ file: name, status: safe ? 'skipped' : 'error', error: safe ? undefined : body });
      }
    } catch (err) {
      results.push({ file: name, status: 'error', error: err.message });
    }
  }

  // Give PostgREST a moment to pick up the new schema after migrations
  await sleep(3000);

  const hasErrors = results.some(r => r.status === 'error');
  return res.status(hasErrors ? 207 : 200).json({ success: !hasErrors, results });
}
