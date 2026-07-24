# Letterman

Working area for Letterman (newsletter) integration/automation work, kept separate
from the existing Article Board code elsewhere in this repo.

## Status

- API key: loaded as `LETTERMAN_API_KEY` in the environment. **Verified working** — smoke
  test on 2026-07-24 successfully listed both known publications.
- Network access to `api.letterman.ai` is reachable from this environment (no longer
  blocked).
- Auth: `Authorization: Bearer <LETTERMAN_API_KEY>`

### Base URL correction

The base URL previously recorded here (`https://api.letterman.ai/api/ai/`) and the one
hardcoded in the existing integration (`pages/api/articles.js`,
`LETTERMAN_BASE = 'https://api.letterman.ai/api/ai/newsletters-storage'`) both **404** on
the live API now — `GET /api/ai/newsletters-storage` returns Express's generic
`Cannot GET ...` page, meaning the route doesn't exist at all (not an auth failure).

The live API's actual base URL is just the domain root, no `/api` or `/api/ai` prefix:

- `GET https://api.letterman.ai/health` → `{"status":"ok"}` (unauthenticated liveness check)
- `GET https://api.letterman.ai/publications` → list of publications (**this is the
  working "list publications" endpoint** — replaces the old `newsletters-storage` path)
- `GET https://api.letterman.ai/newsletters` → requires `?publicationId=<id>`
  (confirmed via `{"error":"A publication id is required."}` on a bare call)

The existing `pages/api/articles.js` / `scripts/populate-articles.js` code targeting
`/api/ai/newsletters-storage` is stale and will need updating to point at `/publications`
and `/newsletters?publicationId=...` before it will work again against the current API.

### Verified publications (via `GET /publications`)

| name | id | slug | status |
|---|---|---|---|
| Nature Coast Hub | `68ae256689218470f729a68a` | `nature-coast-hub` | active |
| From The Desk Of Joe The Goat Farmer | `6655628d315bdaa9aa76a0f8` | `from-the-desk-of-joe-the-goat-farmer` | active |

Full response includes rich metadata per publication: description, authorName, logoUrl,
websiteUrl/customDomainUrl, sendingConfigured, commentSettings, sendSchedule
(sendDays/sendTime), style/theme settings, footer HTML, createdAt/updatedAt, etc.

## Next

- Decide whether to fix `pages/api/articles.js` in place (point it at `/publications` +
  `/newsletters?publicationId=`) or build the new wrapper separately here before
  touching the existing Article Board code.
- Map out `/newsletters?publicationId=` response shape (article list) and figure out
  create/update/publish endpoints (the old docs mention `POST /newsletters`,
  `PUT /newsletters/{id}`, `POST /newsletters/update-seo-settings/{id}` — none of these
  have been smoke-tested yet against the corrected base URL).
- Figure out what "manage a newsletter" should actually mean day to day (draft review,
  scheduling, etc.) before building anything further.
