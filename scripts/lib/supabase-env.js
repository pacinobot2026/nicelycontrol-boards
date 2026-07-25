/**
 * Shared credential loading for the scripts in this directory.
 *
 * Everything here reads from the environment. Nothing is hardcoded — several of
 * these scripts previously embedded the project's `service_role` JWT and
 * Postgres password in plaintext, which put them in git history permanently.
 *
 * Values come from the real environment first, then `.env.local` (gitignored).
 *
 * Required, depending on which helper you use:
 *   getSupabaseClient()  → SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   getPgClient()        → SUPABASE_DB_URL
 */

const fs = require('fs');
const path = require('path');

let loaded = false;

/**
 * Populate process.env from .env.local. Real environment variables win, so a
 * value exported in the shell overrides the file.
 */
function loadEnvLocal() {
  if (loaded) return;
  loaded = true;

  const envPath = path.join(__dirname, '..', '..', '.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    if (process.env[key]) continue;
    process.env[key] = match[2].trim().replace(/^["']|["']$/g, '');
  }
}

function requireEnv(names) {
  loadEnvLocal();
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    console.error(
      `\n❌ Missing required environment variable(s): ${missing.join(', ')}\n\n` +
      `   Set them in .env.local (gitignored) or export them in your shell.\n` +
      `   Find the values in the Supabase dashboard under\n` +
      `   Project Settings → API (for the URL and service_role key), or\n` +
      `   Project Settings → Database (for the connection string).\n`,
    );
    process.exit(1);
  }
  return names.map((n) => process.env[n]);
}

/**
 * Supabase JS client using the service_role key.
 *
 * service_role bypasses row-level security entirely, so this is server/CLI only
 * — never ship it to a browser. Anything browser-facing should use
 * lib/supabase-client.js and the anon key instead.
 */
function getSupabaseClient() {
  // Validate configuration before loading the driver, so a missing env var
  // reports as a missing env var rather than a module-resolution error.
  const [url, key] = requireEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

/**
 * Direct Postgres client, for scripts that run DDL the REST API can't.
 *
 * Expects a full connection string, e.g.
 *   SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres
 */
function getPgClient() {
  const [connectionString] = requireEnv(['SUPABASE_DB_URL']);
  const { Client } = require('pg');
  return new Client({
    connectionString,
    // Supabase's pooler presents a cert that doesn't validate against the
    // default trust store. Scoped to this connection — deliberately not the
    // process-wide NODE_TLS_REJECT_UNAUTHORIZED=0 that some of these scripts
    // used to set, which disabled certificate checking for everything.
    ssl: { rejectUnauthorized: false },
  });
}

module.exports = { loadEnvLocal, requireEnv, getSupabaseClient, getPgClient };
