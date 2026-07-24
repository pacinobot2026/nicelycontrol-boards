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
- `GET https://api.letterman.ai/publications` → `{"publications": [...]}`, list of
  publications (**this is the working "list publications" endpoint** — replaces the old
  `newsletters-storage` path). Each publication uses `id`, not `_id`.
- `GET https://api.letterman.ai/newsletters?storageId=<publicationId>` → `{"newsletters":
  [...]}`, list of newsletters/articles for that publication. The query param is
  **`storageId`**, not `publicationId` (brute-forced param names against the live API —
  `publicationId`/`publication_id`/`pubId`/etc. all return `{"error":"A publication id is
  required."}`; `storageId` is what actually works). Each newsletter uses `id`, not
  `_id`, has no `updatedAt` field (only `createdAt`), and the real headline is split
  across `title` (often `null` for drafts) and `subject` (the email subject line —
  usually present even when `title` isn't).
- `GET https://api.letterman.ai/newsletters/<newsletterId>` → single newsletter by id
  (404 with `{"error":"newsletter '<id>' was not found."}` if the id doesn't exist —
  confirms this path expects a *newsletter* id, not a publication id).

**Fixed:** `pages/api/articles.js` now points at `/publications` and
`/newsletters?storageId=...`, and the field mapping was updated for `id` (not `_id`)
and `title || subject` (not `name || title`). Verified end-to-end against the live API:
syncs 74 articles total (71 from Nature Coast Hub, 3 from From The Desk Of Joe The Goat
Farmer).

**Fixed:** `pages/api/articles/approve.js` and `pages/api/articles/reject.js` now PUT to
`https://api.letterman.ai/newsletters/{id}` (domain root, matching the pattern above).
The request body also changed — Letterman's real `state` enum is only `DRAFT` /
`NEED_APPROVAL` / `PUBLISHED` / `REVISED`, there's no `approved`/`rejected` value, so the
old `{status: 'approved'|'rejected'}` body never matched Letterman's schema even once the
path was fixed. Both handlers now send `{state: 'DRAFT'}`, which just clears the
`NEED_APPROVAL` flag — verified live against a non-sending draft (JTGF publication has
`sendingConfigured: false`): PUT `NEED_APPROVAL` → `DRAFT` confirmed via a follow-up GET,
no side effects (no send triggered), then restored to its original state. Per Joe's call,
Approve and Reject both map to the same Letterman-side transition (`DRAFT`) — they only
diverge in our own Supabase `status` column (`approved` vs `rejected`), since Letterman
has no concept that distinguishes the two.

**Still stale** (not yet fixed — out of scope for this pass): `scripts/populate-articles.js`
and `scripts/populate-with-sections.js` still hardcode `/api/ai/newsletters-storage`.

### Verified publications (via `GET /publications`)

| name | id | slug | status |
|---|---|---|---|
| Nature Coast Hub | `68ae256689218470f729a68a` | `nature-coast-hub` | active |
| From The Desk Of Joe The Goat Farmer | `6655628d315bdaa9aa76a0f8` | `from-the-desk-of-joe-the-goat-farmer` | active |

Full response includes rich metadata per publication: description, authorName, logoUrl,
websiteUrl/customDomainUrl, sendingConfigured, commentSettings, sendSchedule
(sendDays/sendTime), style/theme settings, footer HTML, createdAt/updatedAt, etc.

## Next

- Fix the remaining stale callers: `scripts/populate-articles.js`,
  `scripts/populate-with-sections.js`.
- Confirm the remaining write endpoints against the corrected base URL (old docs
  mention `POST /newsletters` for create, and `POST
  /newsletters/update-seo-settings/{id}` — neither has been smoke-tested yet).
- Figure out what "manage a newsletter" should actually mean day to day (draft review,
  scheduling, etc.) before building anything further.
