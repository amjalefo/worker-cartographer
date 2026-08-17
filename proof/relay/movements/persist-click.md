# Card — record click

```
type: process · card: persist · universe: live · status: verified 2026-08-16
```

**One sentence.** The one write on the redirect path, and the only place raw IP and
user-agent are ever touched — off the response path, and never bound into SQL.

**Why this shape.** Two constraints shape it and both are structural. First, it must not be
able to break a redirect: the call is wrapped in `ctx.waitUntil` (`worker.js:95`) so the
response is already returned, and the INSERT itself is inside a try/catch that swallows the
error into a console line (`worker.js:185-188`). Second, it must not be able to leak identity:
IP and UA enter at `worker.js:171` and `:96`, go into a digest at `worker.js:173`, and the
bind list at `worker.js:179-184` has no slot for either. The privacy claim is a consequence of
the bind list, not of a policy.

**Shape.**
- Called once, non-blocking, only when `skipTracking` is false — `worker.js:94-98`
- Timestamps are computed twice in two shapes: ISO at `worker.js:162`, and operator-local
  day/hour at `worker.js:163` and `:181` via `localDay` / `localHour` (`worker.js:685-690`)
- Truncation happens at the bind, not at the column: `suffix` to 64 chars (`worker.js:180`),
  `referrer` to 120 (`worker.js:183`), `visitor_hash` to 16 hex chars (`worker.js:173`)
- 13 positional placeholders against 13 named columns — `worker.js:176-184`
- Country comes from `request.cf.country` with a header fallback and a literal `'XX'` last
  resort — `worker.js:164-167`

**Connected to.**
- **owns:** every row in `clicks`; nothing else writes that table
- **owned-by:** `handleRedirect`, which is its only caller (`worker.js:95`)
- **joins:** binds `link.id` into `clicks.link_id` (`worker.js:180`), and `picked.variant` from
  `pickTarget` (`worker.js:96`) into `clicks.variant`
- **looks-like-but-is-not:** the conversion write in `handleTrack` (`worker.js:226-233`). Same
  table-shape, same try/catch-and-continue posture, same `localDay` call. Different trust
  boundary entirely: that one accepts `slug`, `suffix`, `variant` and `event` from an
  **untrusted public request body** (`worker.js:206-213`) and defends with `String().slice()`,
  while this one composes every value server-side from the request Cloudflare already parsed.
  Reasoning about input validation from this function and applying it there is backwards.

**If you change this.**
- **Hits:** `clicks` (`schema.sql:29-45`) and the export column list (`worker.js:787`) — the
  bind is positional, so any column reordering here corrupts data without an error.
- **Hits:** `uniqueCount` (`worker.js:770-777`). It counts `DISTINCT visitor_hash WHERE
  visitor_hash <> ''`; changing the hash inputs at `worker.js:173` — including the salt chain
  `env.SALT || env.ADMIN_TOKEN` — resets what "unique" means from that moment forward, with no
  error and no migration.
- **Does not hit:** the destination. `target` is fully resolved at `worker.js:88`, before this
  is scheduled, and `Response.redirect` at `worker.js:105` never waits on it. A change here —
  including one that throws outright — cannot alter or delay where a visitor lands.
- **Does not hit:** `pageInterstitial` (`worker.js:579`). The natural guess, since both are
  gated by the same `skipTracking` flag two lines apart (`worker.js:94`, `:102`) and both are
  "tracking". They share a condition, not a mechanism: one writes a row server-side, the other
  emits third-party pixel scripts to the browser from `links.pixel_*` (`schema.sql:15-17`).
  Disabling one leaves the other running.

**Surfaces.** No human, no agent. Code only, after the response, on every non-bot,
non-opted-out redirect. Failure is logged and invisible to the visitor.

**See.** `worker.js:160-189`
