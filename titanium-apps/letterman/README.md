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

**Still stale** (not yet fixed — out of scope for this pass): `scripts/populate-articles.js`
and `scripts/populate-with-sections.js` still hardcode `/api/ai/newsletters-storage`;
`pages/api/articles/approve.js` and `pages/api/articles/reject.js` still PUT to
`https://api.letterman.ai/api/newsletters/{id}` (also missing the `/api` prefix removal).

**Approve/reject were broken — now fixed and verified (2026-07-24).**

Correction to an earlier note in this file: it claimed a failed approve could leave the
Supabase row reading `approved` while Letterman disagreed. That was wrong. The
Letterman call runs *before* the Supabase update, so a 404 throws first and Supabase is
never touched. There was no state divergence — approve simply failed with a generic 500.

## Write API (verified against a throwaway draft, since deleted)

| Operation | Call |
|---|---|
| Create | `POST /newsletters` with `{storageId, subject, title}` → **201**, returns the new object |
| Update | `PUT /newsletters/{id}` (PATCH is **not** supported — 404) |
| Delete | `DELETE /newsletters/{id}` → **204** |

**The state field is `state`, not `status`, and values are uppercase.** Full enum, as
reported by the API itself when given an invalid value:

```
DRAFT | PUBLISHED | READY | SENT | NEED_APPROVAL | DONE
APPROVED | REVISED | FOR_FORMATTING | FOR_REVISION | FOR_APPROVAL
```

So the old handlers were wrong three ways at once: dead URL, wrong field name
(`status`), and wrong value casing (`approved`).

**Approval has preconditions.** `PUT {state: 'APPROVED'}` returns **400** with
`"Add a subject and pre-header before approving this newsletter."` if `subject` or
`preHeader` is empty. This is expected and actionable, so both handlers now pass
Letterman's message through to the caller rather than swallowing it in a generic 500.

**Note on `reject`:** the enum has no `REJECTED`. `FOR_REVISION` was chosen as the
closest match to "send back," and it accepts cleanly (200). If the intended behaviour
is "return to the author's drafts," change it to `DRAFT` — it's a one-word edit in
`pages/api/articles/reject.js`.

Also fixed: both handlers now write the raw uppercase state to Supabase, matching what
the sync in `pages/api/articles.js` writes (`status: article.state`). Previously they
wrote lowercase `approved`/`rejected`, which disagreed with every sync.

Verification method: created a draft in "From The Desk Of Joe The Goat Farmer", probed
the enum, set a pre-header, transitioned to APPROVED (200, confirmed by re-GET), tested
FOR_REVISION / REVISED / DRAFT (all 200), then deleted it (204, GET now 404). The
publication is back to its original 3 articles.

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
  `scripts/populate-with-sections.js`, `pages/api/articles/approve.js`,
  `pages/api/articles/reject.js`.
- Confirm the write endpoints against the corrected base URL (old docs mention
  `POST /newsletters`, `PUT /newsletters/{id}`, `POST
  /newsletters/update-seo-settings/{id}` — none of these have been smoke-tested yet).
- Figure out what "manage a newsletter" should actually mean day to day (draft review,
  scheduling, etc.) before building anything further.
