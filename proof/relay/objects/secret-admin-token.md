# Card — `ADMIN_TOKEN`

```
type: object · card: secret · universe: live · status: verified 2026-08-16
```

**One sentence.** The single shared key that is the whole authentication system, and — when
`SALT` is unset — also the pepper for the visitor hash. Value not in the repo, by design.

**Why this shape.** Relay is single-operator; there is no user table and no session, so one
bearer token is the entire access model (`worker.js:267-271`). The second job is the
load-bearing one: `recordClick` needs a server-side secret so `visitor_hash` cannot be
recomputed from a known IP + UA, and rather than *require* a second secret the author
defaults to this one — `env.SALT || env.ADMIN_TOKEN` (`worker.js:172`). That chain is why
rotating the admin token is not a purely administrative act; see *If you change this*.

**Shape.**
- Read site 1, auth — `worker.js:269`. Note the shape: `!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN`.
  **Absent secret fails closed**: every `/api/*` request returns 401 rather than opening.
- Read site 2, hashing pepper — `worker.js:172`, with a third fallback to the literal string
  `'relay'` if neither secret exists
- Extracted from the header by a case-insensitive strip, so `bearer` works — `worker.js:268`
- Not in the repo: `wrangler.toml:29-32` lists it as a `wrangler secret put` comment and
  nothing else; `.gitignore:3-4` excludes `.dev.vars`. **This card does not know the value.**

**What fails without it.** Not the redirect. `/api/*` returns `{"error":"unauthorized"}` 401
(`worker.js:270`) and the dashboard is unusable; `/:slug` redirects, `/track` postbacks, and
click recording all keep working, the last with the weakest possible pepper (`worker.js:172`).

**Connected to.**
- **owns:** every `/api/*` route, all of them behind the single check at `worker.js:269`
- **owned-by:** Cloudflare's secret store — set by CLI, never by file
- **joins:** `clicks.visitor_hash` (`schema.sql:43`) is derived from it whenever `SALT` is unset
- **looks-like-but-is-not:** `CONVERSION_TOKEN` (`worker.js:215-218`). Both are bearer-ish
  secrets compared with `!==`, and a reader hardening auth will assume one policy covers both.
  Opposite defaults: absent `ADMIN_TOKEN` **closes** the admin API (`worker.js:269`), absent
  `CONVERSION_TOKEN` **opens** `/track` to the public — the `if` is only entered when the
  secret exists (`worker.js:215`). Also a different header, `x-conversion-token` (`worker.js:216`).

**If you change this.**
- **Hits:** every unique-visitor number already in `clicks`. Rotating this token while `SALT`
  is unset changes the hash input at `worker.js:173`, so post-rotation rows hash differently
  from pre-rotation rows and `COUNT(DISTINCT visitor_hash)` (`worker.js:772`) double-counts
  returning visitors across the boundary. Setting `SALT` first decouples them permanently.
- **Hits:** the dashboard's stored copy. `index.html:2826` asks the operator to paste the same
  string and keeps it in browser `localStorage` (`index.html:2492-2494`); a rotation logs it out.
- **Does not hit:** `DASH_ORIGIN` and the CORS layer (`worker.js:822-832`). The obvious wrong
  neighbour — both are "who may call the API", and `DASH_ORIGIN` even defaults to `"*"`
  (`wrangler.toml:16`). CORS is browser-side advice and never rejects anything here; the
  `corsHeaders` result is attached to the 401 itself (`worker.js:270`). Tightening
  `DASH_ORIGIN` does not add an authentication check, and loosening it does not remove one.

**Surfaces.** A human sets it once via `wrangler secret put` (`wrangler.toml:29`) and pastes
it into the dashboard. Code reads it on every `/api/*` request and every recorded click.
Never logged, never returned in a response body.

**See.** `worker.js:262-271`
