# What already exists — verify, don't rebuild

Inventory of Letterman/newsletter/publishing machinery **already built in this repo**
(`pacinobot2026/nicelycontrol-boards`, deployed to nicelycontrol.com via Vercel).

Joe's directive: *"I don't need it to reinvent things that have already been
developed, just maybe verification."* Read this before writing any new Letterman,
article, or newsletter code.

**Caveat:** this is a static read of the code. None of it has been run or verified
against the live API in a session yet — network access to `api.letterman.ai` was
blocked at the time of writing. Treat everything below as "built, unverified."

---

## Letterman / newsletter pipeline

### API routes
| Route | What it does |
|---|---|
| `pages/api/articles.js` | Main article fetch. Serves from Supabase by default; `?sync=true` or `?refresh=true` pulls fresh from Letterman and upserts. Has a 5-min in-memory cache. |
| `pages/api/articles/approve.js` | `POST {articleId}` → sets status `approved` in Letterman, then mirrors to Supabase. Supabase failure is non-fatal by design. |
| `pages/api/articles/reject.js` | Same shape, rejection path. |
| `pages/api/publications.js` | Full CRUD on a `publications` table (Supabase-backed, per-user via auth token). Stores `letterman_id` / `letterman_url` to link local records to Letterman. |
| `pages/api/article-ideas.js` | Article idea capture/backlog. |
| `pages/api/approve.js`, `reject.js`, `publish.js`, `bulk-action.js` | Top-level approve/reject/publish/bulk endpoints (distinct from the `/articles/*` pair — worth confirming which set is actually live). |

### Front end
- `pages/articles.js` — the Article Board (review/approve/publish UI).
  Note `pages/articles.js.backup` also exists.
- `pages/publications.js` — publication management UI.
- `pages/api-docs.js`, `pages/api/swagger.js` — there's an API docs surface already.

### Key resolution (already handles multi-tenant)
`getLettermanKey()` in `pages/api/articles.js` resolves in this order:
1. Per-user key from the Supabase `settings` table (`key = 'letterman_api_key'`),
   looked up via the caller's auth token
2. Falls back to `process.env.LETTERMAN_API_KEY`

So the UI supports users storing their own Letterman key. Don't rip this out.

### Database tables (Supabase)
- **`articles`** — schema in `supabase/articles-schema.sql`, documented in
  `supabase/README.md`. Columns include `letterman_data JSONB` (full raw API
  response), SEO fields, `status`, `publication_id`.
- **`article_queue`** — created by `scripts/create-article-queue-table.js`.
  This is the **queueing** layer: `number`, `title`, `headline`, `type`, `priority`,
  `status` (default `pending`), `word_count`, `key_points`, `angle`, `sources`,
  `publication`, `letterman_article_id`. Populated by
  `scripts/populate-article-queue.js` and `scripts/load-west-valley-queue.js`.
- **`publications`**, **`settings`**, **`social_posts`**, **`vault_items`** — all
  in use by their respective routes.

### Scripts
- `scripts/populate-articles.js` — sync publications + articles from Letterman.
- `scripts/populate-with-sections.js` — same, plus pulls per-article *sections*
  (`/api/ai/newsletters/{id}/sections`). Richer than the above.
- `scripts/populate-article-queue.js`, `load-west-valley-queue.js` — seed the queue.
- `scripts/create-article-queue-table.js`, `create-table*.js` — DDL helpers.

---

## ⚠️ Two Letterman base paths are in use — verify which is right

Reads use `/api/ai/`:
```
https://api.letterman.ai/api/ai/newsletters-storage
https://api.letterman.ai/api/ai/newsletters-storage/{pubId}/newsletters
https://api.letterman.ai/api/ai/newsletters/{articleId}/sections
```

But approve/reject write to `/api/` with **no** `ai` segment:
```
PUT https://api.letterman.ai/api/newsletters/{articleId}
```

One of these is probably wrong, or the API genuinely splits read/write namespaces.
**This is the single highest-value thing to verify first** once network access is
open — if approve/reject has been silently 404ing, the whole approval workflow is
broken and nobody would necessarily have noticed.

---

## Other integrations already present

- **PostBridge** — `pages/api/postbridge/{accounts,posts/[id],media/[id]}.js`,
  `pages/api/social-posts.js`, `pages/social-posts.js`, `pages/videocue.js`.
  Social publishing/scheduling. Uses `POSTBRIDGE_API_KEY`.
- **Vizard** — `scripts/vizard-processor.js`, `update-vizard-urls.js`,
  `vimeo-monitor.js`, `skills/deploy-vizard-dashboard.yaml`. Video clip pipeline
  feeding the Video Cue board.
- **Kanban** — `pages/api/kanban/{tasks,team-members,migrate}.js`,
  `components/kanban/`. Note `components/kanban/constants.js` already lists all four
  Titanium apps as tags: `mintbird`, `coursesprout`, `letterman`, `globalcontrol`.
- **Boards** (per README): Command Center, Custom Commands, Business Board, Operator
  Vault, Project Board, Article Board, Idea Board, Video Cue, Wish List, Resource
  Library, Prospect Board.
- `new-ui-reference/` — a near-complete parallel copy of the app. Appears to be a
  UI redesign reference. **Don't edit it assuming it's live**; confirm intent first.

---

## 🔴 Hardcoded credentials found in this repo

Three files carry live secrets in plaintext, committed to git history:

| File | Secret |
|---|---|
| `scripts/create-vault-table.js` | Supabase Postgres password |
| `scripts/seed-businesses.js` | same password |
| `scripts/create-article-queue-table.js` | **Supabase `service_role` JWT** |

The `service_role` key is the serious one — it bypasses row-level security entirely,
i.e. full read/write on every table.

**This also answers "I can't find the Supabase project":**
- Project URL: `https://jqqvqdjxviqnsgpxcgfs.supabase.co`
- Project ref: `jqqvqdjxviqnsgpxcgfs`
- Postgres user: `postgres.jqqvqdjxviqnsgpxcgfs`
- Host: `aws-1-us-east-1.pooler.supabase.com`

Joe searched his own Supabase account and couldn't find it, so it's likely owned on
Chad Nicely's / Pacino's side. Whoever owns it needs to rotate both the DB password
and the service_role key. Every *other* script in the repo already reads these from
env correctly — these three are just leftovers and should be cleaned up to match.
