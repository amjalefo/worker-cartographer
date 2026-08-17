# Card — `app_settings`

```
type: object · card: table · universe: live · status: verified 2026-08-16
```

**One sentence.** A two-column key/value table with exactly one key in use — `access_mode` — which silently outranks the `ACCESS_MODE` var in `wrangler.toml`.

**Why this shape.** Access mode is the switch that decides whether an anonymous visitor can create an inbox at all (`inboxes.js:232`). Keeping it only in `[vars]` would mean a redeploy per flip. Making it a row lets an admin flip it over HTTP (`router.js:129-135`) — and forces every request to re-read it, because a Worker isolate can outlive the change. That is why `applyRuntimeSettings` runs unconditionally at the top of `handleApi` (`router.js:208`), before dispatch.

**Shape.**
- `key TEXT PRIMARY KEY`, `value TEXT NOT NULL`, plus `created_at`/`updated_at` — `schema.sql:134-139`; identical body in `migrations/0004_app_settings.sql:1-6`
- The only key ever written: `'access_mode'`, via an upsert — `settings.js:30-34`
- The only key ever read: `'access_mode'`, bound at `config.js:112`
- The read overwrites the config field in place — `config.js:113`, after re-validating through `normalizeAccessMode` (`config.js:47-53`), which throws a 400 on a bad stored value
- **The read is wrapped in a bare `catch {}`** — `config.js:114-116`. A missing table, a locked database, any D1 failure at this line is swallowed and the deploy silently falls back to the `[vars]` value. The comment calls it backward compatibility for deployments predating migration 0004.
- No index beyond the primary key. None is needed — one key, one row.

**Connected to.**
- **owns:** the effective access mode for the current request
- **owned-by:** the `DB` binding (`wrangler.toml:14-17`)
- **joins:** nothing. No foreign keys in either direction; it is the only free-standing table in the schema.
- **looks-like-but-is-not:** the `[vars]` block of `wrangler.toml:23-34`. Both are "settings", and `ACCESS_MODE` appears in both places by design. `wrangler.toml:24` is only the **boot default** — it is validated at `config.js:91` and then overwritten at `config.js:113` on every API request that reaches D1. Editing `wrangler.toml` and redeploying to change access mode changes nothing once a row exists. Also not `publicSettings` (`settings.js:18-23`) — that is the read-only projection an admin sees, and it reports `privacyLock` too, which has no row and can only come from `[vars]`.

**If you change this.**
- **Hits:** `src/server/config.js:108-118` — the only reader, and the only place that knows the key string `'access_mode'`; and `src/server/settings.js:25-35` — the only writer, holding the same string a second time. The two are not shared through a constant, so renaming the key is a two-file edit and a partial edit leaves the write succeeding and the read finding nothing. Then `src/server/inboxes.js:232`, `:260-263`, `:283-286` — three separate branches whose behaviour flips with the value, and `config.js:134` for the `/api/private/*` boundary.
- **Does not hit:** `src/server/auth.js`. It is the natural next file — "access mode" sounds like an auth concern — and it has no notion of public or private at all. `requireUser` (`auth.js:161`) demands a bearer token in both modes; `login` (`auth.js:192`) works in both. Access mode only decides whether *unauthenticated* inbox use is allowed, and that decision lives entirely in `inboxes.js`. Hardening private mode by editing `auth.js` changes nothing about the anonymous path.

**Surfaces.** Written by an admin through `POST /api/admin/settings/access-mode` (`router.js:129-135`), which requires the admin role at `router.js:131` and then also mutates the in-flight config at `router.js:133` so the response reflects the new value. Read by code on every single API request. No human edits the row directly in the documented flow; no agent touches it.

**See.** `schema.sql:134-139`
