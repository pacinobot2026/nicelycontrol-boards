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
