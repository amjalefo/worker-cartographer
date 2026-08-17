# Card — `clicks`

```
type: object · card: table · universe: live · status: verified 2026-08-16
```

**One sentence.** One row per counted redirect — product says "a click", the table says
`clicks`, and the row deliberately cannot be traced back to a person.

**Why this shape.** The privacy claim is enforced by what the table *cannot* hold, not by a
policy document. There is no IP column and no user-agent column; the raw IP and UA are read
at `worker.js:171` and `:96`, fed into a hash at `worker.js:173`, and never bound into the
INSERT (`worker.js:179-184`). `referrer` stores a hostname only, because `refHost` throws the
path and query away before the value ever reaches SQL (`worker.js:647-650`). The
de-duplication key rotates daily by construction — the day string is inside the hash input
(`worker.js:173`) — so yesterday's visitor and today's cannot be joined even by the operator.

**Shape.**
- Table + FK cascade to `links` — `schema.sql:29-45`
- `ts_day` (`YYYY-MM-DD`) and `ts_hour` (0-23) are **denormalised at write time** in the
  operator's timezone, not UTC — `schema.sql:36-37`, written from `worker.js:181`
- `visitor_hash` is a 16-char truncated SHA-256, unique-visitor use only — `schema.sql:43`,
  built at `worker.js:173`
- Five indexes, all leading with `link_id` — `schema.sql:47-51`
- Every read filters on `ts_day >= ?` against a day string, never on `ts` — `worker.js:430`, `:436`, `:444`

**Connected to.**
- **owns:** the entire analytics surface. Every number in `/api/stats/:id` is a `COUNT(*)` over this table (`worker.js:428-446`)
- **owned-by:** the `DB` binding (`wrangler.toml:8-10`)
- **joins:** `clicks.link_id` → `links.id`, with `ON DELETE CASCADE` declared at `schema.sql:44`
- **looks-like-but-is-not:** `conversions` (`schema.sql:54-66`). Nearly the same columns —
  `link_id`, `slug`, `suffix`, `variant`, `ts`, `ts_day` — and a reader will assume a change
  here needs the mirror change there. It usually does not: `conversions` is written by a
  *public unauthenticated* route (`worker.js:194`, `:226`) while `clicks` is written only by
  the redirect path, and every `conversions` read is wrapped in a try/catch that returns
  zeroes when the table is absent (`worker.js:242`, `:255-257`). They have different trust
  models and different failure modes.

**If you change this.**
- **Hits:** the INSERT's 13-column positional bind at `worker.js:176-184` — positional, so an
  inserted column silently shifts every value after it. And `apiExport`'s hard-coded column
  list at `worker.js:787`, which is both the SELECT and the CSV header row (`worker.js:799`).
- **Hits:** `uniqueCount` at `worker.js:770-777`, whose entire error path exists to survive a
  `clicks` table that predates `visitor_hash` — it returns `null`, not `0`, on any SQL error.
- **Does not hit:** `schema.sql`'s `links` table. The obvious wrong neighbour: it sits 20
  lines above in the same file, and a new tracking dimension feels like it needs a matching
  link setting. It does not — `mode`, `variants_json` and `utm_json` are read only by
  `pickTarget` and `applyUtm` (`worker.js:108`, `:142`), which run *before* any write here and
  never read this table.
- **Does not hit:** `index.html`. It renders whatever `breakdown` keys the API hands it
  (`worker.js:460-469`); a new column that is not surfaced in that object is invisible to the
  dashboard, and grepping the 3020-line dashboard after a schema change finds nothing —
  which reads as "safe" and is really "wrong file".

**Surfaces.** Written only by `recordClick`, and only inside `ctx.waitUntil` (`worker.js:95`)
— never on the response path, so a write failure cannot break a redirect (`worker.js:185-188`
swallows it into a log). Read by the admin API and the CSV/JSON export. No human writes it.
No agent touches it.

**See.** `schema.sql:29-51`
