# Card — the four redirect gates

```
type: process · card: gate · universe: live · status: verified 2026-08-16
```

**One sentence.** Four sequential hard stops between "a slug arrived" and "a destination is
chosen" — each ends the request with a different status code, and none of them is a warning.

**Why this shape.** They are ordered cheapest-first and, more importantly, they are ordered so
the response never reveals more than it must: a reserved or unknown or disabled slug all
return the *same* 404 body (`worker.js:848-855`), which is why `!link` and `!link.active`
share one line (`worker.js:64`) instead of getting distinct codes. Expiry and password get
their own codes because those are states the *legitimate* visitor is supposed to see and act on.

**Shape.**
- **Reserved slug** — `worker.js:60`, `return notFound()`. The set is `api`, `favicon.ico`,
  `robots.txt`, `track`, and empty string (`worker.js:14`); it is what keeps a link named
  `track` from shadowing the postback route.
- **Unknown or disabled** — `worker.js:64`, one `return` for both conditions
- **Expired** — `worker.js:67-69`, `410` with a rendered page. Note `Date.parse` on a free-form
  string column (`schema.sql:19`); an unparseable value yields `NaN`, the comparison is false,
  and the link stays live. Fail-open, deliberately: a typo does not kill a working link.
- **Password** — `worker.js:72-79`. The only one that can end the request with a `200`
  (`worker.js:77`): a first visit gets the form, a wrong password gets `401`. The digest is
  slug-scoped, `sha256(slug + ':' + pw)` (`worker.js:74`), so the same password on two links
  produces two hashes — `schema.sql:14` and `worker.js:530-532` agree on that construction.

All four end the run. There is no fall-through and no logged-and-continued variant.

**Connected to.**
- **owns:** whether `pickTarget` is ever reached (`worker.js:85`)
- **owned-by:** `handleRedirect` — the gates are the first half of the same function, not a module
- **joins:** consumes the `links` row from `lookupLink` (`worker.js:62`); everything downstream
  assumes all four passed
- **looks-like-but-is-not:** `skipTracking` at `worker.js:91`. It sits eleven lines below the
  last gate, is computed the same way, and reads like a fifth one. **It is not a gate.** A bot
  or a DNT visitor is still redirected at `worker.js:105`; only the click write (`worker.js:94`)
  and the pixel interstitial (`worker.js:102`) are skipped. Converting it to an early return
  would make Relay stop redirecting for every link-preview crawler on the internet.
- **looks-like-but-is-not:** the destination gate at `worker.js:519-524`. Also a hard stop,
  also about links — but it `throw`s at *write* time inside `normFields` and is caught into a
  400 by `handleApi` (`worker.js:306-308`). It protects what may be stored; these protect what
  may be served.

**If you change this.**
- **Hits:** `pagePassword` (`worker.js:603-614`), whose form posts back to `/slug/suffix` by
  GET with a `pw` parameter (`worker.js:604`, `:609`, `:611`) — the gate at `worker.js:73` reads
  that exact parameter name. Renaming it breaks the form silently, since a missing `pw` is a
  valid first-visit state.
- **Hits:** `RESERVED` (`worker.js:14`) and `normSlug` (`worker.js:663-668`) together. `normSlug`
  strips everything outside `A-Za-z0-9_-`, so a route added with a dot or slash in it can never
  be claimed as a slug — adding a route without adding it to `RESERVED` only matters for names
  that survive that filter.
- **Does not hit:** `handleApi`'s auth check (`worker.js:269`). The obvious wrong neighbour —
  both reject requests, both are early returns near the top of their function. That one proves
  *who is calling*; these ask whether a public request is *allowed to be served*. Hardening the
  admin API touches nothing here, and a reader auditing "access control" who reads only
  `handleApi` will have read the wrong half of the file.
- **Does not hit:** `clicks`. A gated request never reaches `recordClick` (`worker.js:95`), so
  blocked traffic leaves no row and no analytics number moves.

**Surfaces.** No human, no agent. Code only, on every public redirect, before anything else runs.

**See.** `worker.js:57-79`
