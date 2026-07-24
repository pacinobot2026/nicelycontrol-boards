# Operating Context — Joe's businesses, agents, and the Titanium apps

Written 2026-07-24. Distilled from a full read of the `shared-context` Google Drive
folder (70 files) that a prior AI agent ("Alex") built up over several months.

**Purpose:** so a fresh session doesn't have to re-derive all of this. If something
here looks stale, the source of truth is the Drive folder — see "Re-reading the source"
at the bottom.

---

## The businesses

| Entity | What it is |
|---|---|
| **Connectuate** (JTGF LLC d/b/a Connectuate) | Joe's core business. A white-label of HighLevel/GoHighLevel selling "AI Employee" voice + chat assistants to local service businesses (home services, clinics) for lead intake, scheduling, follow-up. Domain: connectuate.ai / connectuate.com |
| **Titanium Software** | Chad Nicely's product suite. Four apps we care about: Letterman, MintBird, CourseSprout, Global Control Center (plus QuizForma, mentioned but not scoped). Joe promotes these / earns affiliate revenue. |
| **"OpenClaw Cracked" / Joe the Goat Farmer** | A $27 course + affiliate business promoted via Chad Nicely. joethegoatfarmer.com. NOT a literal farm — "The Goat Pen" is a Telegram buyer-verification lobby. |
| **Harmony Oaks** | A real property/household Joe manages. Daily "board report"-style updates go to Yvette Vanderhiser ("Harmony"). Separate from the software businesses. |
| **A1 Land Clearing** | A prospective Connectuate client. A full bot proposal exists, reusing the Connectuate voice-AI playbook as a template. |

## The agent fleet (prior generation, built on "OpenClaw")

These are the agents referenced throughout the Drive folder. Most were unreliable;
this repo's work is partly about taking over what they did.

- **Alex** — main ops agent, Windows gateway, email alex@connectuate.com. Handled
  Connectuate day-to-day. Authored most of the shared-context folder.
- **Alex Shadow** — sibling instance managing Harmony Oaks.
- **Johnny Price** — separate agent on a Cloudflare/Linux gateway. Persona: "AI CEO"
  for the Titanium/course marketing side. **Required 3 full rebuilds** due to memory
  loss; was offline (stalled heartbeat) as of March 2026. Unclear if ever recovered.
- **Juma** — NOT a bot. A read-only OpenAI Custom GPT acting as Joe's strategic
  advisor. Reads synced digests (`JUMA-DIGEST.md`), never executes, hands Joe
  ready-to-send messages to relay. There's an elaborate KB-sync/anti-drift protocol
  around keeping its knowledge base current.
- **Manus** — external agent coordinated with via a shared Kanban "Control Board".
- **Popcorn** — small gatekeeping bot for the course Telegram lobby.

Coordination ran over a Supabase `agent_messages` table — **self-documented as
unreliable** (no delivery confirmation, cross-gateway messages silently vanish).
Treat that architecture as a dead end, not a model to copy.

---

## Titanium apps — technical detail

This is the part that matters most for the work ahead. Verified working by the prior
agent (per `BOT-INVENTORY.md`, dated 2026-03).

### Letterman (newsletters)
- Base: `https://api.letterman.ai/api/ai/`
- Auth: `Authorization: Bearer <LETTERMAN_API_KEY>` (JWT)
- Known endpoints: `newsletters-storage` (list publications),
  `newsletters-storage/{pubId}/newsletters`, `newsletters/{id}/sections`
- Verified commands: `letterman.me`, `letterman.publications.list`
- **Existing publications:**
  - "From The Desk Of Joe The Goat Farmer" — id `6655628d315bdaa9aa76a0f8`
  - "Nature Coast Hub" — id `68ae2566892184 70f729a68a`
- Safety rails the prior agent locked in: draft-only by default, never auto-publish,
  delete requires explicit confirmation.
- **This repo already integrates Letterman** — see `pages/api/articles.js`, the
  Supabase `articles` table, `supabase/README.md`, and the Article Board. Look there
  before building anything new.

### MintBird (page builder)
- Auth: API key (Poplinks API)
- Verified: `products.list` → 200, `salespages.list` → 200
- Read-only by default; writes require explicit confirmation.
- Note: a MintBird token was once exposed in a chat log and flagged "treat as
  compromised until rotated." Joe has accepted that exposure. No key value appears
  anywhere in the Drive folder.

### Global Control Center (CRM)
- Auth: `X-API-KEY` header
- **Uses `/api/ai/*` paths, NOT `/api/v1/*`** — this was an explicit anti-regression
  note; don't rediscover it the hard way.
- Verified: `me` → 200, `tags list` → 200 (12 tags), `debug-config` → 200
- Read-only by default.

### CourseSprout (courses)
- Least mapped of the four. Johnny Price had an account but **no API wrapper was ever
  built**. Endpoints undocumented. Likely needs browser-driven work or fresh API
  discovery.

---

## Connectuate / HighLevel API

- Docs: https://marketplace.gohighlevel.com/docs/
- Connectuate is a white-label of HighLevel, so HighLevel's API *is* the Connectuate
  backend.
- **Working OAuth scopes** (validated): contacts (r/w), opportunities (r/w),
  custom fields (r/w), calendars (r/w), conversations + conversations/message (r/w —
  this is how SMS gets sent), voice-ai-agents (r/w), voice-ai-agent-goals (r/w),
  agent-studio (r/w), conversation-ai (r/w), medias (r/w), links (r/w),
  workflows (read), forms (read), invoices (r/w).
- **Known dead ends — do not burn cycles here:** Funnels API and Sites API are
  read-only via OAuth. Joe issued an explicit directive (2026-03-24) to stop trying
  to find "the right endpoint" and just use the HighLevel UI for those. Only revisit
  if Joe says a specific workflow requires it.
- SMS send: `POST https://services.leadconnectorhq.com/conversations/messages`
  with `{"type":"SMS","contactId":"...","message":"..."}`

---

## Operational protocols the prior agent ran

These are the recurring workflows Alex/Johnny Price operated. Useful as a spec for
what "taking over" actually means — and as a warning about what was over-engineered.

### Juma digest cadence
- `JUMA-DIGEST.md` is a recurring status report Alex produced: system health, pipeline
  status, flags needing Joe's attention, cost tracking, active tasks. Juma (the
  read-only Custom GPT) consumes it and returns strategic guidance.
- `titanium-juma-digest-protocol.md` is a **separate, stricter** protocol scoped to
  Titanium oversight. Two modes: DAILY and INCIDENT. Hard authority boundary — the
  agent may *observe and pause*, but may **not resolve money-affecting incidents
  without Joe's explicit approval**. Worth preserving that rule.
- `JUMA-KB-SYNC-CHECKLIST.md` + `JUMA-VIEW-PROMPT.md` cover keeping Juma's knowledge
  base current, including a nonce-based verification trick to detect "drift" (Juma
  answering from a stale KB). Clever, but it exists because manual sync is fragile.
- `new-file-notification-sop.md` — any new shared-context file had to be announced to
  sibling agents to stop their KBs diverging.

### Skills / release pipeline
- Skills were packaged as zips and installed onto a bot via **Telegram DM upload**
  (no SSH) — `joes-ai-skill-loader-sop-v1.0.4.md`.
- Naming is locked: `<skill>_vYYYY-MM-DD_p<N>.zip`
  (`certified-skill-zip-naming-standard.md`).
- `PUBLISH-PACKET-SOP.md` + manifest schema/template: changes get bundled into a
  "publish packet," scanned for secrets and personal data (including UUID leaks),
  and then **a human pushes to GitHub** — the AI was explicitly barred from holding
  a GitHub token.
- `RELEASE-KB-CHECKLIST.md` — what must/must-not enter Juma's KB on each release.
- Certification gate per app: delete → drag/drop → configure → smoke test. That's how
  letterman/mintbird/globalcontrol got marked verified.

### Comms
- Telegram is the primary human channel. 4 groups, 25+ forum topics, mapped in
  `telegram-groups-inventory.md` / `telegram-topics-map.md`: **JTGF – Company Test
  Ground** (ops), **Harmony Oaks Stuff** (household), **Open Claw Demo** (Chad's
  affiliate demo room), **The Goat Pen** (course buyer lobby).
- Escalation ladder: Telegram for routine → **SMS for urgent** (trigger words:
  "priority", "urgent", "text me", "SMS"), sent via the HighLevel conversations API.
  `sms-escalation-system.md` tracks unanswered SMS so late replies reconcile to
  original context.
- `group-chat-protocol.md` — when to speak vs stay silent in a group where the agent
  sees every message.
- `email-reply-monitoring.md` — watches joe@joethegoatfarmer.com, alerts to Telegram.

### Cost / model routing
- `model-routing.md` — route by cost/complexity across Claude Sonnet/Haiku/Opus and
  Kimi K2.5; different defaults for Joe vs employees.
- `llm-pricing-reference.json`, `token-tracking-system.md`, `daily-cost-tracker.json`
  — cost tracking, **self-described as rough estimates and "way off" per Joe.** Don't
  trust those numbers.

### Honest assessment
Much of the above is ceremony that existed to compensate for unreliable agents and
manual file syncing (memory loss, heartbeat failures, KB drift). Preserve the *rules*
that encode real judgment — the money-incident authority boundary, draft-only
defaults, human-pushes-to-GitHub, secrets scanning. Don't import the machinery built
to work around problems this setup doesn't have.

---

## Open threads inherited from the prior setup

1. Johnny Price's offline status was never confirmed resolved.
2. The Supabase inter-agent messaging layer is admitted-unreliable; a rebuild-vs-pivot
   decision was never made.
3. **Three scripts in this repo hardcode live Supabase credentials in git history** —
   including a `service_role` JWT (full RLS bypass). Details, affected files, and the
   Supabase project ref are in `ALREADY-BUILT.md`. Needs rotation by whoever owns the
   project, plus a cleanup commit.
4. `shared-anthropic-key-system.md` in the Drive folder contains a live Anthropic API
   key in cleartext, attributed to Chad Nicely (tier_4). Joe is aware. Not ours to
   rotate, but worth raising with Chad.

---

## Environment / infrastructure notes

- This repo (`pacinobot2026/nicelycontrol-boards`) deploys to Vercel at
  nicelycontrol.com. The repo is under the `pacinobot2026` account, and
  `AGENTS-RECOVERY.md` says "Built by Pacino" and directs questions to Chad — so the
  Supabase and Vercel projects are probably Chad-owned, not Joe's.
- `.env.local` is gitignored and does NOT survive between cloud sessions. Persistent
  keys belong in the environment's **environment variables** setting (configured via
  the cloud icon → hover environment → gear icon on claude.ai/code).
- Direct API calls need the domain allowlisted in the environment's **Network access**
  setting (Custom + allowed domains, or Full). MCP connectors (Drive, Gmail, GitHub)
  route through Anthropic and do NOT need allowlisting.

---

## Re-reading the source

The original Drive folder is **`shared-context`**, id `1K5G9Ye34r51-_rj5YbmKkoE0Z0GSy9SN`,
owned by alex@connectuate.com, shared with theharmonyoaks@gmail.com (which is the
account the Google Drive MCP connector is authenticated as — note it is NOT
joe@connectuate.com).

70 files, all `text/plain`. Read them with the Google Drive MCP tools
(`download_file_content` returns base64). Highest-value files if you need to go deeper:
`BOT-INVENTORY.md`, `JP-3.0-REBUILD-SPEC.md`, `JOHNNY_PRICE_BRIEFING.md`,
`highlevel-oauth-platform-limitations.md`, `knowledge-organization.md`,
`ALEX-OPERATIONAL-SKILLS-AUDIT.md`, `USER.md`, `telegram-groups-inventory.md`.

Listing the folder in one call returns ~310KB and will blow up a context window —
page it or fan it out to subagents.
