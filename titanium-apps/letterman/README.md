# Letterman

Working area for Letterman (newsletter) integration/automation work, kept separate
from the existing Article Board code elsewhere in this repo.

## Status

- API key: loaded locally in `.env.local` as `LETTERMAN_API_KEY` (not committed — gitignored).
- Live API calls to `api.letterman.ai` are currently blocked by this environment's
  network policy (outbound requests need `api.letterman.ai` added to the allowlist).
- Base URL: `https://api.letterman.ai/api/ai/`
- Auth: `Authorization: Bearer <LETTERMAN_API_KEY>`
- Known publications (from earlier ops notes): "From The Desk Of Joe The Goat Farmer",
  "Nature Coast Hub"

## Next

- Get `api.letterman.ai` allowlisted, then re-run a smoke test (list publications).
- Figure out what "manage a newsletter" should actually mean day to day (draft review,
  scheduling, etc.) before building anything further.
