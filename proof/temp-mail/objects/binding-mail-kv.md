# Card — `MAIL_KV`

```
type: object · card: binding · universe: ghost (deliberate) · status: verified 2026-08-16
```

**One sentence.** A KV namespace declared in the deploy config and read by nothing — the product word would be "the cache", and there is no cache.

**Why this shape.** The obvious use for KV here is the rate limiter, and the rate limiter is D1 instead: it reads and writes a `rate_limits` row per bucket per window (`security.js:75-87`), with a `UNIQUE (bucket_key, window_start)` to make the window collapse (`schema.sql:152`). Once counting moved into the same database as everything else, the namespace had no reader left. `README.md:44` states the intent — "Cloudflare KV binding placeholder for Worker config compatibility" — but that sentence is not the evidence; the grep below is.

**Shape.**
- `[[kv_namespaces]]` — `wrangler.toml:19`
- `binding = "MAIL_KV"` — `wrangler.toml:20`
- `id = "00000000000000000000000000000000"` — `wrangler.toml:21`. A placeholder id, exactly like `database_id` at `wrangler.toml:17`. **Neither is a secret and neither is real**; both must be replaced before a deploy binds anything.

**Ghost evidence.**
```
grep -rn "MAIL_KV" . --exclude-dir=.git --exclude=package-lock.json
→ wrangler.toml:20:binding = "MAIL_KV"
```
One hit, and it is the declaration. There is no `env.MAIL_KV` in `src/`, in `tests/`, or in `README.md`. For contrast, the same grep for `ASSETS` returns three hits — `wrangler.toml:8` plus two real read sites at `src/worker/index.js:20` and `:21`. That is what a live binding looks like in this tree.

**Connected to.**
- **owns:** nothing
- **owned-by:** `wrangler.toml:19-21`
- **joins:** nothing
- **looks-like-but-is-not:** the `DB` binding at `wrangler.toml:14-17`. They sit four lines apart, both have zeroed-out ids, and both look equally provisional. `DB` is load-bearing in seven modules, each of which throws `database_not_configured` without it (`auth.js:104`, `inboxes.js:10`, `email.js:9`, `jobs.js:4`, `settings.js:6`, `api-keys.js:10`, `api-key-requests.js:8`). `MAIL_KV` is inert. A reader cleaning up placeholder ids must replace one and may delete the other.

**If you change this.**
- **Hits:** nothing in `src/`. Deleting `wrangler.toml:19-21` today changes no behaviour — the Worker never reads it. *Adding* a read site is where this card starts costing: a first `env.MAIL_KV.get()` makes a real namespace id mandatory at deploy time and adds a second store to reason about, next to a D1 that already holds sessions, keys and rate-limit windows.
- **Does not hit:** `src/server/security.js`. It is the file a reader assumes KV is for — it is the only module in the tree doing counters and windows — and it never touches KV. `checkRateLimit` opens with `if (!env.DB)` at `security.js:67` and every statement below it is D1. Moving rate limiting to KV is a rewrite of `security.js:66-90`, not a wiring change.

**Surfaces.** No human, no agent, no code. It exists only in the deploy manifest.

**See.** `wrangler.toml:19-21`
