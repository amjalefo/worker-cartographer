# 05 — Change impact

Pointers only. The waterfalls live in the cards' *If you change this* sections and are not repeated here, per `reference.md:49`.
(The catalog already carries the short version of this table; see `07-friction.md` §6 on why this step and the catalog overlap.)

| Change you are about to make | Open, in this order | Stop after |
|---|---|---|
| loosen or tighten who can read a message | `gate-inbox-access` | one card — it names its six dependent routes |
| flip public ↔ private | `table-app-settings` | one card |
| add or rename a `[vars]` entry | `secrets` (it owns the boot-time throw at `config.js:13-19`) | one card |
| add a new API route | catalog §Movements for the pipeline order, then `gate-inbox-access` if the route touches inbox data | two |
| change what is stored from inbound mail | `persist-inbound-email` | one |
| change retention or the cron | `schedule-retention` | one |
| add a second cron | `schedule-retention` — the handler discards `_event` (`src/worker/index.js:32`), so today a second expression runs the same sweep | one |
| wire KV, or delete the placeholder | `binding-mail-kv` | one |
| add a column to `attachments` | `persist-inbound-email` — the write side has a two-attempt fallback (`email.js:93-107`) mirrored on the read side (`inboxes.js:112-121`); a new column needs both or neither | one |
| rename a column on `inboxes` | `table-inboxes` | one |
| add a handler (`queue`, another `fetch` route class) | `entry` | one |
| restyle the landing page | **none of these cards.** The SPA is outside the mapped set — `binding-assets` says why, `DESIGN_SPEC.md` is the brief, and `tests/verify-static.js:30-63` is what will fail you |

**Three traps this map exists to prevent**

1. Editing `wrangler.toml:24` (`ACCESS_MODE`) to change access mode. Once an `app_settings` row exists it wins on every request (`config.js:112-113`). → `table-app-settings`
2. Adding a rate limit "to the write path" in `security.js` and assuming inbound mail is covered. It is not — mail never reaches `router.js`. → `persist-inbound-email`
3. Unifying `requireInboxAccess` and `requireInboxAddressAccess`. They differ by one branch on purpose (`inboxes.js:264` exists; the address path has no equivalent and ends at `inboxes.js:287`). → `gate-inbox-access`
