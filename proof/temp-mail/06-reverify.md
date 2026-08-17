# 06 — Re-verify

Second pass over the Hits / Does-not-hit claims. Each was re-read or re-grepped after the card was written, 2026-08-16.

| Claim | How re-checked | Result |
|---|---|---|
| `entry` — "the frontend never imports from `src/server/` or `src/worker/`" | `grep -n "server/\|worker/" src/frontend/App.vue src/frontend/main.js` → no output; `main.js:1-4` imports only vue/pinia/App/styles | **holds** |
| `schedule-retention` — "`ctx.waitUntil` is used once in the tree" | `grep -rn "waitUntil" src/` → one hit, `src/worker/index.js:34` | **holds** |
| `persist-inbound-email` — "no transaction, no batch" | `grep -rn "batch(\|BEGIN\|TRANSACTION" src/` → no output | **holds** |
| `binding-mail-kv` — "zero read sites" | `grep -rn "MAIL_KV" .` → one hit, the declaration at `wrangler.toml:20` | **holds** |
| catalog — "`audit_events` is never written" | `grep -rn "audit_events" .` → schema, migration, two indexes, and `tests/verify-schema.js:12`; nothing under `src/` | **holds** |
| `secrets` — "`config.sessionSecret` / `config.jwtSecret` have no consumer" | `grep -rn "sessionSecret"` → `config.js:95` only; `grep -rn "jwtSecret"` → `config.js:96` only | **holds** |
| `secrets` — "a missing secret breaks `/api/health` too" | re-read `router.js:205-209`: `loadConfig(env)` at `:206` runs before `dispatch`, and `/api/health` is inside `dispatch` at `:30`; the throw is caught at `src/worker/index.js:12` | **holds** |
| `gate-inbox-access` — "the address path has no token branch" | re-read `inboxes.js:268-288`; last statement is an unconditional `throw` at `:287`; no `inboxTokenMatches` call in that function | **holds** |
| `table-app-settings` — "the D1 read is swallowed on failure" | re-read `config.js:111-116`; bare `catch {}` with a comment, no rethrow | **holds** |
| `table-inboxes` — "the cron never touches `inboxes`" | re-read `jobs.js:8-21`; the only table names are `messages` and `attachments` | **holds** |
| `table-inboxes` — "a domain must be in both `MAIL_DOMAINS` and the `domains` table" | re-read `inboxes.js:186-192`: `:187` checks `config.mailDomains`, `:190` checks the row with `status='active' AND is_verified=1` | **holds** |

**Corrected during the pass.** One citation was wrong on first writing: the `wrangler secret put` block is `README.md:212-214`, not `211-213` (211 is the fence). Fixed in `objects/secrets.md`.

**Downgrades.** None. No card is `stale`.

**Not re-verified, and named as such.** `src/server/mime.js` (341 lines) was never opened. It is cited only indirectly, as the producer of the values inserted at `email.js:124-131`. Any card about MIME parsing would be `status: stub` and this map does not claim one.

**One inconsistency in the territory, recorded not diagnosed.** `PRIVACY_LOCK` is declared twice in `wrangler.toml`, at `:25` and `:27`, with the same value. The `README.md:187-198` block lists it once. Which line a TOML parser keeps is not this map's question; that both lines exist is.
