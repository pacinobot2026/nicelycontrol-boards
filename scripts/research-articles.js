#!/usr/bin/env node
/**
 * Article research → queue loader.
 *
 * Takes candidate story ideas gathered from the web, removes anything already
 * covered, and writes the survivors into the `article_queue` table as `pending`
 * rows for human review. Nothing here publishes, approves, or contacts
 * Letterman's write API — the approval gate in the Article Board is untouched.
 *
 * Usage:
 *   node scripts/research-articles.js --file candidates.json --publication "Nature Coast Hub"
 *   node scripts/research-articles.js --file candidates.json --publication "..." --dry-run
 *
 * Options:
 *   --file <path>          JSON array of candidates (required; use "-" for stdin)
 *   --publication <name>   Publication these belong to (required)
 *   --dry-run              Report what would happen; write nothing
 *   --threshold <0..1>     Dedupe sensitivity (default 0.6; lower = more aggressive)
 *   --skip-letterman       Dedupe against the queue only, not published articles
 *
 * Candidate shape (mirrors the `article_queue` columns):
 *   {
 *     "title":      "Crystal River July 4th Celebration",
 *     "headline":   "Fireworks Over Kings Bay: Crystal River's Fourth Returns Downtown",
 *     "type":       "EVENTS",          // EVENTS | COMMUNITY | BUSINESS | NEWS | WILDLIFE | HEALTH
 *     "priority":   "HIGH",            // HIGH | MEDIUM | LOW
 *     "word_count": 350,
 *     "key_points": "4-9PM Downtown Town Square; fireworks 9PM over Kings Bay",
 *     "angle":      "Family-friendly, walkable downtown, free to attend",
 *     "sources":    "NatureCoaster.com, Fun 4 Nature Coast Kids"
 *   }
 *
 * `sources` should name every outlet a fact came from. Keep it populated —
 * it is what makes the rewrite defensible, and the Article Board surfaces it
 * to whoever approves the piece.
 *
 * Environment (no credentials are hardcoded in this file — see the note in
 * titanium-apps/ALREADY-BUILT.md about the three scripts that do):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   required
 *   LETTERMAN_API_KEY                         optional; enables dedupe against
 *                                             already-published articles
 */

const fs = require('fs');
const path = require('path');
const { partitionCandidates } = require('./lib/article-dedupe');

const LETTERMAN_BASE = 'https://api.letterman.ai';

// ---------------------------------------------------------------- env loading

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = line.match(/^([^=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key]) continue; // real env wins over the file
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

// ------------------------------------------------------------------ arg parse

function parseArgs(argv) {
  const args = { threshold: 0.6, dryRun: false, skipLetterman: false };
  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case '--file': args.file = argv[++i]; break;
      case '--publication': args.publication = argv[++i]; break;
      case '--threshold': args.threshold = Number(argv[++i]); break;
      case '--dry-run': args.dryRun = true; break;
      case '--skip-letterman': args.skipLetterman = true; break;
      case '--help': args.help = true; break;
      default:
        throw new Error(`Unknown argument: ${argv[i]}`);
    }
  }
  return args;
}

function readCandidates(file) {
  const raw = file === '-'
    ? fs.readFileSync(0, 'utf8')
    : fs.readFileSync(file, 'utf8');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Could not parse ${file} as JSON: ${err.message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Candidate file must contain a JSON array.');
  }
  return parsed;
}

function validateCandidates(candidates) {
  const problems = [];
  candidates.forEach((c, i) => {
    if (!c.title && !c.headline) {
      problems.push(`#${i + 1}: needs a title or headline`);
    }
    if (!c.sources) {
      problems.push(`#${i + 1} (${c.title || c.headline}): missing "sources"`);
    }
  });
  return problems;
}

// --------------------------------------------------------------- data sources

async function fetchQueue(supabaseUrl, serviceKey, publication) {
  const url = new URL('/rest/v1/article_queue', supabaseUrl);
  url.searchParams.set('select', 'id,title,headline,publication,status');
  if (publication) url.searchParams.set('publication', `eq.${publication}`);

  const res = await fetch(url, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) {
    throw new Error(`Supabase read failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/**
 * Pull already-written articles from Letterman so research doesn't re-suggest
 * a story that has already been covered. Failures here are non-fatal: losing
 * this comparison set makes dedupe weaker, not wrong.
 */
async function fetchLettermanArticles(apiKey, publicationName) {
  const headers = { Authorization: `Bearer ${apiKey}` };

  const pubRes = await fetch(`${LETTERMAN_BASE}/publications`, { headers });
  if (!pubRes.ok) throw new Error(`GET /publications → ${pubRes.status}`);
  const { publications = [] } = await pubRes.json();

  const target = publications.find((p) => p.name === publicationName);
  if (!target) {
    const names = publications.map((p) => p.name).join(', ') || '(none)';
    throw new Error(`No Letterman publication named "${publicationName}". Found: ${names}`);
  }

  const listRes = await fetch(
    `${LETTERMAN_BASE}/newsletters?storageId=${encodeURIComponent(target.id)}`,
    { headers },
  );
  if (!listRes.ok) throw new Error(`GET /newsletters → ${listRes.status}`);
  const { newsletters = [] } = await listRes.json();
  return newsletters;
}

async function insertRows(supabaseUrl, serviceKey, rows) {
  const res = await fetch(new URL('/rest/v1/article_queue', supabaseUrl), {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`Supabase insert failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// ------------------------------------------------------------------- main

async function main() {
  loadEnvLocal();
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.file || !args.publication) {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
    process.exit(args.help ? 0 : 1);
  }

  const candidates = readCandidates(args.file);
  const problems = validateCandidates(candidates);
  if (problems.length) {
    console.error('❌ Candidate problems:\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  console.log(`📥 ${candidates.length} candidate(s) for "${args.publication}"`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local or environment).');
    process.exit(1);
  }

  // Build the comparison set: what's already queued, plus what's already written.
  const existing = [];

  const queued = await fetchQueue(supabaseUrl, serviceKey, args.publication);
  existing.push(...queued);
  console.log(`   ${queued.length} row(s) already in article_queue`);

  if (!args.skipLetterman && process.env.LETTERMAN_API_KEY) {
    try {
      const written = await fetchLettermanArticles(
        process.env.LETTERMAN_API_KEY, args.publication,
      );
      existing.push(...written);
      console.log(`   ${written.length} article(s) already in Letterman`);
    } catch (err) {
      console.warn(`   ⚠️  Skipping Letterman comparison — ${err.message}`);
      console.warn('      Dedupe will only consider the queue.');
    }
  }

  const { fresh, duplicates, nearMisses } = partitionCandidates(
    candidates, existing, args.threshold,
  );

  console.log();
  for (const d of duplicates) {
    const name = d.candidate.title || d.candidate.headline;
    const match = d.record.title || d.record.headline || d.record.subject;
    console.log(
      `   ⏭  skip "${name}" — ${d.reason} ${d.score.toFixed(2)} vs ${d.against === 'this-run' ? 'earlier candidate' : 'existing'} "${match}"`,
    );
  }

  // Scores just under the line are where this heuristic is least reliable, so
  // name them rather than silently letting them through.
  for (const n of nearMisses) {
    const name = n.candidate.title || n.candidate.headline;
    const match = n.record.title || n.record.headline || n.record.subject;
    console.log(
      `   ⚠️  "${name}" scored ${n.score.toFixed(2)} against "${match}" — under the ${args.threshold} threshold, but worth a look.`,
    );
  }

  if (fresh.length === 0) {
    console.log('\n✅ Nothing new to queue. Everything was already covered.');
    return;
  }

  const rows = fresh.map((c) => ({
    title: c.title || c.headline,
    headline: c.headline || c.title,
    type: c.type || 'NEWS',
    priority: c.priority || 'MEDIUM',
    status: 'pending', // human approves from the Article Board; never auto-advance
    word_count: c.word_count ?? null,
    key_points: c.key_points ?? null,
    angle: c.angle ?? null,
    sources: c.sources ?? null,
    publication: args.publication,
  }));

  if (args.dryRun) {
    console.log(`\n🔍 Dry run — ${rows.length} row(s) would be inserted:\n`);
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const inserted = await insertRows(supabaseUrl, serviceKey, rows);
  console.log(`\n✅ Queued ${inserted.length} new item(s) as "pending" for review.`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
