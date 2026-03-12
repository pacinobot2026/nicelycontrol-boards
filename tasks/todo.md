# Data Isolation Fix - Mar 4, 2026

## Problem
All API routes use the service role key which bypasses Supabase RLS.
The code must explicitly filter by `user_id` in every query.

## Root Causes
1. `login.js` redirects to `/dashboard` but that page doesn't exist → 404 after login
2. `api/clips.js` GET: `const userId = null` hardcoded → all users see all clips
3. `api/ideas.js`: GET has no user filter, POST missing `user_id`, PUT/DELETE reference undefined `user` variable
4. `pages/ideas.js`: doesn't send auth token on GET fetch → API can't identify user
5. `api/articles.js`: no `user_id` filter on reads, no `user_id` on upserts
6. `articles` DB table: likely missing `user_id` column (no migration found)

## Todo

- [x] Create `pages/dashboard.js` that redirects to `/videocue`
- [x] Fix `pages/api/clips.js` GET: extract user from auth token, use real userId
- [x] Fix `pages/api/ideas.js`: get user in all 4 methods, scope all queries by user_id
- [x] Fix `pages/ideas.js`: send auth token in GET fetch
- [x] Create migration `007_add_user_id_to_articles.sql` for articles table
- [x] Fix `pages/api/articles.js`: filter reads by user_id, include user_id on upserts

## Review

**Root cause:** All API routes use the service role key which bypasses Supabase RLS — so explicit `user_id` filtering was required in every query.

### Changes made:

**[pages/dashboard.js](pages/dashboard.js)** — new file: redirects `/dashboard` → `/videocue` so login no longer 404s

**[pages/api/clips.js](pages/api/clips.js)** — replaced `const userId = null` with real user extraction from auth token; all clip queries now scoped to the logged-in user

**[pages/api/ideas.js](pages/api/ideas.js)** — rewrote to call `getUser()` at the top of every request; GET now filters by `user_id`, POST includes `user_id` in insert, PUT/DELETE scope by `user_id` (previously referenced an undefined `user` variable)

**[pages/ideas.js](pages/ideas.js)** — added `Authorization` header to GET fetch; changed `useEffect` to depend on `session` so it only runs when logged in

**[migrations/007_add_user_id_to_articles.sql](migrations/007_add_user_id_to_articles.sql)** — adds `user_id` column + index to the `articles` table. **Must be run manually in the Supabase SQL editor.**

**[pages/api/articles.js](pages/api/articles.js)** — added `getUserId()` helper; GET from DB now filters `.eq('user_id', userId)`; Letterman sync upserts now include `user_id` on every article

---

# Fixes - Feb 27, 2026

## Tasks

- [x] **1. Add `initial-scale=1` to viewport meta tag**
  - No viewport meta tag exists anywhere in the project
  - Add `<meta name="viewport" content="width=device-width, initial-scale=1" />` in `_app.js` using `next/head`
  - (Can't go in `_document.js` Head — Next.js doesn't support viewport there properly)

- [x] **2. Add `<title>` to all pages**
  - Only 2 of 13 pages have titles (vault.js, api-docs.js) — the rest show the URL in the browser tab
  - Add a default title in `_app.js` via `next/head` so every page gets a title immediately (even while loading)
  - Individual pages that already have titles will override via Next.js head deduplication

- [x] **3. Fix `overflow-x` not working on Business Board**
  - The `<main>` element is a flex child with `flex: 1` but no `min-width: 0`
  - Flex items default to `min-width: auto`, which prevents them from shrinking below content size — this breaks `overflow-x`
  - Fix: add `minWidth: 0` and `overflowX: 'auto'` to the `<main>` element in `businesses.js`

## Review

### Changes made:

**[_app.js](pages/_app.js)** — 2 lines added:
- `<meta name="viewport" content="width=device-width, initial-scale=1" />` — fixes mobile scaling
- `<title>Nicely Media Dashboard</title>` — default title for all pages; pages with their own `<title>` (vault, api-docs) override it automatically

**[businesses.js:219](pages/businesses.js#L219)** — 2 CSS properties added to `<main>`:
- `minWidth: 0` — allows the flex child to shrink below content size (flex items default to `min-width: auto`)
- `overflowX: 'auto'` — enables horizontal scrolling when content overflows
