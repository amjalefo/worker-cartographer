# 01 — Catalog · temp-mail

One Worker, one deploy. Verified 2026-08-16.
This page answers "what is X" without opening a card. Open **one** card, then stop. Never load `objects/` whole.

---

## Colliding names — read this first

| The word | Means here | Also means | This map covers |
|---|---|---|---|
| the product name | `temp-mail` — the Worker name and the deploy (`wrangler.toml:1`) | `rdhx-email` — the npm package (`package.json:2`), the D1 database name (`wrangler.toml:16`), the `service` string in the health response (`router.js:32`), the API-key prefix `rdhx_` (`api-keys.js:30`), and the localStorage keys (`App.vue:4-5`). "Temp-mail" is the UI word (`DESIGN_SPEC.md:31`). | both names. **`temp-mail` and `rdhx-email` are the same deploy.** There is no second Worker. |
| `DB` | the binding name in code — `env` is hung on the config object at `router.js:207`, and every module re-guards `env.DB` itself (`auth.js:104`, `jobs.js:4`, `settings.js:6`, `inboxes.js:10`, `email.js:9`, `api-keys.js:10`, `api-key-requests.js:8`) | a D1 database whose real name is `rdhx-email-db` (`wrangler.toml:16`) | both names, stated once |
| `token_hash` | in `sessions` (`schema.sql:33`) it is **base64** — written by `sha256Base64` (`auth.js:150`) | in `api_keys.key_hash` (`schema.sql:103`) and `inboxes.access_token_hash` (`schema.sql:51`) it is **hex** — written by `sha256Hex` (`api-keys.js:102`, `inboxes.js:340`) | both. A session token and an inbox token are hashed with different encodings of the same digest. Comparing across them silently never matches. |
| `sha256Hex` | three separate functions with the same name: `security.js:20` (rate-limit subjects), `api-keys.js:22` (keys + inbox tokens, the only exported one), `email.js:49` (attachment checksums) | — | all three. Editing "the" `sha256Hex` means picking one of three files. |
| `normalizeLocalPart` | the validator in `security.js:37` | a one-line re-wrapper of it in `inboxes.js:32`, plus `assertLocalPart` at `inboxes.js:36` calling the same validator again | the validator at `security.js:37` is the only implementation |
| `MAIL_DOMAINS` | `temp.com` in the committed config (`wrangler.toml:26`) | `rdhx.email` everywhere in the docs (`README.md:190`) and in the seed rows (`README.md:165`) | the code path: `config.js:55-66` is the only reader, and it validates shape, not membership in the docs |
| access mode | `ACCESS_MODE` in `[vars]` (`wrangler.toml:24`) — the **boot** value | the `access_mode` row of `app_settings` (`settings.js:31`), which **overwrites** it on every API request (`config.js:112-113`) | both. The var is a default; the row is the truth. |
| "privacy lock" | `PRIVACY_LOCK` in `[vars]` — declared **twice**, `wrangler.toml:25` and `wrangler.toml:27` | one enforcement site only: `inboxes.js:223-227` (blocks admins, nobody else) | both lines. The second is a duplicate with the same value. |

**Worker vs Worker:** none. One `wrangler.toml`, one `main`. Nothing here belongs to a sibling deploy.

---

## Nouns

| Card | Type | Universe | Anchor |
|---|---|---|---|
| [entry](objects/entry.md) | `entry` | live | `src/worker/index.js:6-36` |
| [`MAIL_KV`](objects/binding-mail-kv.md) | `binding` | **ghost, deliberate** | `wrangler.toml:19-21` |
| [`DB`](objects/binding-db.md) | `binding` | live | `wrangler.toml:14-17` — *stub* |
| [`ASSETS`](objects/binding-assets.md) | `binding` | live | `wrangler.toml:6-9`, read `index.js:20-21` — *stub* |
| [the three secrets](objects/secrets.md) | `secret` | live | `config.js:95-97` |
| [`inboxes`](objects/table-inboxes.md) | `table` | live | `schema.sql:45-62` |
| [`app_settings`](objects/table-app-settings.md) | `table` | live | `schema.sql:134-139` |
| `messages` | `table` | live | `schema.sql:64-81` — *stub* |
| `attachments` | `table` | live (col `storage_key` ghost) | `schema.sql:83-96` — *stub* |
| `users` / `sessions` | `table` | live | `schema.sql:13-43` — *stub* |
| `api_keys` / `api_key_requests` | `table` | live | `schema.sql:98-132` — *stub* |
| `rate_limits` | `table` | live | `schema.sql:141-153` — *stub* |
| `audit_events` | `table` | **ghost** | `schema.sql:155-168` — *stub*, evidence below |
| `domains` | `table` | live | `schema.sql:3-11` — *stub* |
| `/api/*` route surface | `route` | live | `router.js:30-202` — *stub* |
| `config-record` | — | **type unused in this territory** | see 07-friction |

## Movements

Request pipeline for a data route, in the order it runs (`router.js:205-215` → `dispatch`, `router.js:23`):

`resolve` boundary (`router.js:25`) → CORS/preflight (`router.js:26-28`) → `gate` runtime access mode (`config.js:112`) → route branch → **`gate` rate limit** (`security.js:88`) → `resolve` actor (`inboxes.js:195-215`) → **`gate` inbox access** (`inboxes.js:241-266`) → `render` public shape (`inboxes.js:124-141`) → `persist` where the route writes

| Card | Type | Universe | Anchor |
|---|---|---|---|
| [inbox access gate](objects/gate-inbox-access.md) | `gate` | live | `inboxes.js:241-266` |
| [inbound mail persist](objects/persist-inbound-email.md) | `persist` | live | `email.js:111-153` |
| [retention sweep](objects/schedule-retention.md) | `schedule` | live | `wrangler.toml:11-12` → `jobs.js:8-21` |
| rate-limit gate | `gate` | live | `security.js:66-90` — *stub* |
| API-key verify | `verify` | live | `api-keys.js:151-168` — *stub* |
| password verify | `verify` | live | `auth.js:85-93` — *stub* |
| actor resolve | `resolve` | live | `inboxes.js:195-215` — *stub* |
| public-shape render | `render` | live | `inboxes.js:55-141` — *stub* |

---

## Ghosts, with the grep behind each

Run from the repo root; `.git` and `package-lock.json` excluded.

**`MAIL_KV`** — `grep -rn "MAIL_KV" .` returns exactly one line: `wrangler.toml:20`. No `env.MAIL_KV` anywhere. Deliberate: `README.md:44` lists it as "Cloudflare KV binding placeholder for Worker config compatibility". Rate limiting, which is where a KV would be expected, is D1 (`security.js:75-87`). **Do not implement against it.**

**`audit_events`** — `grep -rn "audit_events" .` returns `schema.sql:155`, `schema.sql:190-191` (its two indexes), `migrations/0001_permanent_inbox_schema.sql:130`, `:163-164`, and `tests/verify-schema.js:12` (which asserts the table exists). **Zero hits under `src/`.** The table is created, indexed, tested for existence, and never written. This one is not declared anywhere as deliberate.

**`attachments.storage_key`** — `grep -rn "storage_key" .` returns `schema.sql:89` and `migrations/0001_permanent_inbox_schema.sql:89`. Nothing else. Attachment bytes go inline into `content_base64` (`email.js:81-92`, read back at `inboxes.js:455`). The column is the shape of an external-blob design that was not built.

**`config.adminBootstrap.hashStrategy`** — `grep -rn "hashStrategy" .` returns one line, `config.js:85`, where it is written. `ADMIN_BOOTSTRAP_HASH_STRATEGY` appears only at `config.js:79` and `config.js:81`. The accepted value `argon2id-external` (`config.js:4`) has no implementation: `grep -rn "argon2" .` hits only `config.js:4` and `config.js:81`. Setting it changes nothing; the one hasher is PBKDF2 (`auth.js:72-83`).

**`config.rateLimits.messageReadPerMinute`** — written at `config.js:103` with bounds `min 1, max 3000`. `grep -rn "messageReadPerMinute" .` returns that line only. The six read routes bypass it and go to the env var raw: `inboxes.js:367`, `:379`, `:399`, `:409`, `:434`, `:447`. The **var** is live; the **validated config field** is a ghost, so the bounds never apply.

**`config.sessionSecret` / `config.jwtSecret`** — `grep -rn "sessionSecret" .` → `config.js:95` only. `grep -rn "jwtSecret" .` → `config.js:96` only. The secrets themselves are live (see the secrets card); these two config fields are not.

**captcha** — `grep -rni "captcha" .` returns `DESIGN_SPEC.md:16`, `DESIGN_SPEC.md:70`, and `tests/verify-static.js:71`, which asserts runtime code must **not** match `/captcha/i`. The design brief protects a subsystem the test suite forbids. Ghost, and deliberately so.

**`inboxes:*`** (`LEGACY_WRITE_SCOPE`, `api-keys.js:6`) — `leftover`, not ghost. It has live read sites (`api-keys.js:57`, `api-key-requests.js:30`) that fold it into `inboxes:write`, and `migrations/0003_migrate_api_key_scopes.sql:1-9` rewrote stored rows. It can still arrive from an old row; it can no longer be issued (`api-keys.js:7` allows one scope).

---

## Change impact — which card to open first

Open the catalog, then **one** of these. Full waterfalls live in the cards, not here.

| If you are changing… | Open |
|---|---|
| who can read an inbox or a message | `objects/gate-inbox-access.md` |
| public vs private mode | `objects/table-app-settings.md` |
| anything in `wrangler.toml` `[vars]` | `objects/secrets.md` (it owns the boot-time throw) |
| the cron, or retention | `objects/schedule-retention.md` |
| what inbound mail stores | `objects/persist-inbound-email.md` |
| adding a binding, or wiring KV | `objects/binding-mail-kv.md` |
| the address/local-part identity rules | `objects/table-inboxes.md` |
| the three handlers, or adding a fourth | `objects/entry.md` |
