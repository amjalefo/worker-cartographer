# 00 — Inventory

Territory: `territories/temp-mail/` (github.com/fluffyhowl/temp-mail)
Walked 2026-08-16 16:05 -03. One `wrangler.toml`, one `main`, one deploy → one territory.

## Is this a Worker?

Yes, per `identity.md:15-20`:
- `wrangler.toml:1-2` — `name = "temp-mail"`, `main = "src/worker/index.js"`
- `src/worker/index.js:7` `fetch`, `:27` `email`, `:32` `scheduled` — three platform handlers, one file
- D1 schema at `schema.sql`, migrations at `migrations/0001..0005`
- Bindings declared at `wrangler.toml:8` (ASSETS), `:15` (DB), `:20` (MAIL_KV)

**No sibling Worker.** There is exactly one `wrangler.toml` in the tree and one `main`. Nothing here is out of scope for a second deploy.

## Tree, classified

| Path | Universe | Note |
|---|---|---|
| `wrangler.toml` | live | 3 bindings, 1 cron, 10 `[vars]` lines (one duplicated) |
| `src/worker/index.js` | live | the entry — all three handlers |
| `src/server/router.js` | live | every `/api/*` branch |
| `src/server/config.js` | live | env → config object; boot-time gates |
| `src/server/auth.js` | live | users, sessions, PBKDF2 |
| `src/server/inboxes.js` | live | inbox + message + attachment access |
| `src/server/email.js` | live | inbound mail → rows |
| `src/server/api-keys.js` | live | key issue/verify/revoke |
| `src/server/api-key-requests.js` | live | request → approval → key |
| `src/server/security.js` | live | rate limits, size limits, normalizers |
| `src/server/settings.js` | live | runtime `access_mode` write |
| `src/server/cors.js` | live | three-boundary CORS |
| `src/server/http.js` | live | `HttpError`, `json`, `errorJson` |
| `src/server/mime.js` | live | MIME parse (341 lines) — stub card |
| `schema.sql` | live | fresh-install snapshot, 11 tables |
| `migrations/0001..0005` | live | incremental path to the same 11 tables |
| `src/frontend/` (App.vue, styles.css, main.js) | live, **not a Worker noun** | 3.8k lines of Vue served as an asset — see friction |
| `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js` | live, build-side | produce `dist/`, which `[assets]` serves |
| `public/favicon.svg` | live, build-side | |
| `tests/config-router.test.js`, `verify-schema.js`, `verify-static.js` | live | `verify-static.js` encodes invariants, not just tests |
| `DESIGN_SPEC.md` | leftover | a UI brief for one landing page; its "Captcha logic" protected area names something that does not exist |
| `README.md` | live | 430 lines; correct on secrets, correct that MAIL_KV is a placeholder (`README.md:44`) |
| `package-lock.json` | live, not walked | |

## Ghost candidates found in the walk (evidence in the cards)

- `MAIL_KV` binding — `wrangler.toml:20`, zero read sites
- `audit_events` table — `schema.sql:155`, zero read/write sites in `src/`
- `attachments.storage_key` column — `schema.sql:89`, zero write sites
- `config.adminBootstrap.hashStrategy` — `config.js:85`, never read again
- `config.sessionSecret` / `config.jwtSecret` — `config.js:95-96`, values never consumed
- `config.rateLimits.messageReadPerMinute` — `config.js:103`, never read; call sites go to `env` directly
- captcha — named at `DESIGN_SPEC.md:16`, asserted absent by `tests/verify-static.js:71`

No cards written at this step.
