# Card — the entry

```
type: object · card: entry · universe: live · status: verified 2026-08-16
```

**One sentence.** One default export carrying all three platform handlers — `fetch`, `email`, `scheduled` — for a deploy the config calls `temp-mail` and the package calls `rdhx-email`.

**Why this shape.** The three handlers do not share a pipeline, and the file is short because it refuses to build one. `fetch` is the only handler with a `try`; `email` and `scheduled` let their errors escape to the platform on purpose — a thrown error in `email` is how the SMTP conversation gets rejected (`email.js:118` sets the reject reason, then rethrows), and a thrown error in `scheduled` is how a failed cron shows up as a failed cron. Wrapping them the way `fetch` is wrapped would swallow both signals.

**Shape.**
- `fetch(request, env)` — `src/worker/index.js:7`; branches on the `/api/` prefix at `:9`, delegates to `handleApi` at `:11`
- The only `catch` in the file — `:12-17`. It exists for one class of failure: `loadConfig` throwing at `router.js:206` before any route matched. It returns `config_error` with `error.message` in the body.
- Asset fallthrough — `:20-21`. Anything not `/api/` goes to `env.ASSETS`, and `not_found_handling = "single-page-application"` (`wrangler.toml:9`) makes unknown paths return the SPA shell.
- Last-resort plain-text response when `ASSETS` is absent — `:24`
- `email(message, env, _ctx)` — `:27-30`; loads config, then hands off. No `ctx.waitUntil`: the handler must stay alive until the row is written.
- `scheduled(_event, env, ctx)` — `:32-35`; **does** use `ctx.waitUntil` (`:34`), so the cron returns immediately and the sweep runs on the extension.
- `loadConfig` is called three times per deploy path — `:28`, `:33`, and again inside `router.js:206`. There is no shared module-scope config object.

**Connected to.**
- **owns:** the platform contract. Nothing else in the tree is reachable by Cloudflare directly.
- **owned-by:** `wrangler.toml:2` (`main`). Moving this file without editing that line unpublishes the Worker.
- **joins:** `router.js:205` (`handleApi`), `email.js:111` (`handleInboundEmail`), `jobs.js:8` (`cleanupExpiredMessages`), `config.js:89` (`loadConfig`)
- **looks-like-but-is-not:** `src/server/router.js`. Both are "the router". This file routes by *trigger type* — is this an HTTP request, a piece of mail, or a cron? `router.js` routes by *pathname*, and only ever sees traffic that already passed `:9`. Adding a new API path is `router.js` work and this file never changes; adding a queue consumer is this file's work and `router.js` never changes.

**If you change this.**
- **Hits:** `src/server/router.js:205` — `handleApi(request, env)` is called with exactly two arguments and no config; the router builds its own config at `:206`. Any signature change is a two-file change. Also `wrangler.toml:11-12` (the cron trigger has no meaning without `:32`) and `wrangler.toml:6-9` (the assets block has no meaning without `:20-21`).
- **Does not hit:** `src/frontend/App.vue`. It sits one directory away and is the most obvious next file to open, and it is the wrong one — the frontend never imports from `src/worker/` or `src/server/`. It is compiled by Vite into `dist/` (`package.json:9`) and reaches this file only over HTTP, through the `/api/` prefix at `:9`. Changing a handler cannot break a Vue component; changing a Vue component cannot break a handler. The coupling between them is the JSON shapes in `inboxes.js:55-141`, not this file.

**Surfaces.** Written by humans, rarely. Read by the Cloudflare runtime on every request, every inbound message, and once a day at `0 0 * * *`. No agent touches it.

**See.** `src/worker/index.js`
