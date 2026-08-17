# Card — `LINKS_KV`

```
type: object · card: binding · universe: ghost (deliberate) · status: verified 2026-08-16
```

**One sentence.** A KV namespace the redirect path reads before D1 — declared nowhere,
so today every redirect goes straight to D1.

**Why this shape.** Absence is the default configuration, not an oversight. Binding KV buys
edge-cached redirects and costs staleness: an edit is invisible for up to `CACHE_TTL` seconds.
The author made the *unbound* state the correct-and-instant one and left the cache as an
opt-in for scale — `README.md:238` states exactly that trade. Every KV call site is therefore
written to be a no-op when the binding is missing, including `invalidate`, which does nothing
at all without it (`worker.js:763-767`).

**Ghost evidence (required by `rules.md:39`).**
`grep -rn "LINKS_KV" . --exclude-dir=.git` returns:
- reads/writes in code — `worker.js:749`, `:750`, `:755`, `:764`, `:765`
- the declaration — `wrangler.toml:36-38`, and **all three lines are commented out**
  (`# [[kv_namespaces]]` / `# binding = "LINKS_KV"` / `# id = ...`)
- documentation only — `README.md:238`, `wrangler.toml:35`

No uncommented `[[kv_namespaces]]` block exists in the file. The binding is not in the deploy.
**Do not implement against it**, and do not "fix" the commented block — uncommenting it
without a real namespace id is the only way to make this worse.

**Shape.**
- Guarded read, D1 fallback, write-back on miss — `worker.js:748-760`
- Key format is `'link:' + slug` in all four call sites — `worker.js:750`, `:755`, `:765`
- TTL is floored at 60s because KV rejects less — `worker.js:754`, and `CACHE_TTL` is itself
  commented out at `wrangler.toml:26`, so the floor *is* the value
- The cached object is a whole `links` row, stored as JSON — `worker.js:755`

**Connected to.**
- **owns:** nothing today. When bound, it owns the freshness window of every redirect.
- **owned-by:** `wrangler.toml` — a binding exists only if that file says so
- **joins:** shadows the `links` table; `invalidate` is called after every write that changes
  a row, twice on a slug rename (`worker.js:409-410`) and once on delete (`worker.js:419`)
- **looks-like-but-is-not:** the `DB` binding at `wrangler.toml:8-10`. Both are `env.*` data
  stores reached the same way, and both are missing an id in the committed file. They are not
  the same state: `DB`'s block is **live and uncommented** with only `database_id` deferred to
  the deploy button (`wrangler.toml:6`), while this one's block does not exist at all.
  Absent `DB` breaks every route; absent `LINKS_KV` changes nothing.

**If you change this.**
- **Hits:** `lookupLink` (`worker.js:748`) is the single read path for both the redirect
  (`worker.js:62`) and `/track` (`worker.js:221`). Binding KV silently puts the conversion
  postback on cached rows too — a consequence nothing in the code comments mentions.
- **Hits:** the three `invalidate` call sites (`worker.js:409`, `:410`, `:419`). Any *new*
  write path to `links` that forgets one serves a stale redirect for up to 60s.
- **Does not hit:** `apiStats` / `apiOverview` / `apiExport` (`worker.js:423`, `:311`, `:780`).
  The obvious wrong guess is that a cache in front of the DB affects the dashboard's numbers.
  It cannot — every one of those functions calls `env.DB.prepare` directly and none of them
  goes through `lookupLink`. Analytics are always uncached and always current.

**Surfaces.** A human writes it once, in `wrangler.toml`, by running the command spelled out
at `wrangler.toml:35`. Code reads it on every redirect. No agent, no runtime writer.

**See.** `worker.js:747-767`
