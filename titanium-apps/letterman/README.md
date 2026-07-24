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

**`APPROVED` is a real Letterman state — verified twice.** `PUT {state:'APPROVED'}`
returns 200 and reads back as `APPROVED` on a subsequent GET. If anything claims
Letterman has no concept of "approved" and that approving in the Article Board leaves
it showing as `Draft`, that's incorrect at the API level. (Letterman's *own dashboard*
may label the state differently in its UI, but the stored value is `APPROVED`.)

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

## Article research → queue pipeline

`scripts/research-articles.js` + `scripts/lib/article-dedupe.js`.

Takes candidate story ideas gathered from the web, drops anything already covered,
and writes survivors into `article_queue` as `pending` rows. It does not publish,
approve, or call Letterman's write API — the Article Board approval gate is untouched.

```bash
node scripts/research-articles.js --file candidates.json \
  --publication "Nature Coast Hub" --dry-run
```

### Why dedupe is the core of it

"Deduplication strategy" was the **highest-priority unresolved item** on the old
Alex/Manus coordination board — right next to "Search strategies for finding
articles" and "Content quality guidelines," all still sitting in the Inbox column.
The search half was never actually specified; it ran on the Manus agent doing ad-hoc
lookups. So this is a fresh build, not a port.

Without dedupe, recurring events (a festival, a weekly market) get re-queued on every
run. Candidates are compared against both the existing queue **and** the articles
already published in Letterman, plus against each other within a single run.

Matching is Jaccard similarity over content words, with:
- **Number normalization** — "Fourth of July" == "4th of July" == "July 4". This was
  a real bug found in testing: without it, that pair scored 0.50 and slipped through
  as a fresh story.
- **Title-vs-title scoring** alongside whole-text, taking whichever is stronger, since
  headline copy can diverge wildly while titles name the same event.
- **Containment** — a short title fully inside a longer one counts as a match.
- **Near-miss warnings** for anything scoring within 0.15 under the threshold, since
  that band is where the heuristic is least trustworthy.

Default threshold is **0.5**, deliberately biased toward over-deduping: a wrongly
skipped story just means a human doesn't see one suggestion, while a missed duplicate
means readers get the same story twice. Tune with `--threshold`.

### On sourcing

Every candidate must carry a `sources` value or the script refuses the batch. Facts
aren't copyrightable, but close paraphrase of a single outlet's structure and phrasing
is where local-news aggregators get into trouble. Pull from 2+ sources, write fresh
copy, keep the attribution line. Event listings (times, places, prices) are pure fact
and the safest material.

### Verification status

- **Dedupe logic — tested.** Correctly catches ordinal variants (0.80), reworded
  headlines (0.83), same-story-different-framing (0.86), and within-run repeats (1.00),
  while scoring unrelated stories at 0.00 and same-town-different-event at 0.33.
- **Letterman reads — verified** via the endpoints documented above.
- **Supabase read/insert — NOT verified.** `supabase.co` isn't on this environment's
  network allowlist and `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are unset. Run
  `--dry-run` first once those are available.
- **Sandbox note:** Node's built-in `fetch` ignores `HTTPS_PROXY`, so this script can't
  reach allowlisted hosts from inside a proxied cloud session even though `curl` can.
  That's an environment artifact — on Vercel or a normal machine there's no proxy and
  plain `fetch` is correct.

## Next

- Fix the remaining stale callers: `scripts/populate-articles.js`,
  `scripts/populate-with-sections.js`, `pages/api/articles/approve.js`,
  `pages/api/articles/reject.js`.
- Confirm the write endpoints against the corrected base URL (old docs mention
  `POST /newsletters`, `PUT /newsletters/{id}`, `POST
  /newsletters/update-seo-settings/{id}` — none of these have been smoke-tested yet).
- Figure out what "manage a newsletter" should actually mean day to day (draft review,
  scheduling, etc.) before building anything further.
