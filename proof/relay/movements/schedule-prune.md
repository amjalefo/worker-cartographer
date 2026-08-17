# Card — prune old

```
type: process · card: schedule · universe: ghost (deliberate) · status: verified 2026-08-16
```

**One sentence.** The retention sweep — a `scheduled` handler that deletes aged rows and that,
as the repo ships, **no trigger ever calls**.

**Why this shape.** Retention is opt-in twice over, and both switches are off in the committed
config. That is the design: `README.md:239` frames auto-retention as something you *enable*,
and the default posture is "keep forever". Doubling the switch means an operator who
uncomments the cron but forgets `RETENTION_DAYS` deletes nothing rather than everything —
the guard at `worker.js:810` returns on any non-finite or non-positive value.

**Ghost evidence (required by `rules.md:39`).**
`grep -rn "crons\|\[triggers\]" . --exclude-dir=.git` returns exactly five lines:
- `wrangler.toml:42` — `# [triggers]`, commented
- `wrangler.toml:43` — `# crons = ["0 3 * * *"]`, commented
- `worker.js:49` — a source comment describing the requirement
- `README.md:239` and `README.zh-TW.md:239` — documentation

No uncommented `[triggers]` block exists. The handler at `worker.js:50-52` is exported and
unreachable in the deploy. Second switch, independently: `RETENTION_DAYS` **is** declared
(`wrangler.toml:24`) but set to the empty string, so even with a live cron `pruneOld` would
return at `worker.js:810` without touching a row. **Do not implement against this path**, and
do not assume old data is being cleaned.

**Shape.**
- Handler → `ctx.waitUntil(pruneOld(env))`, nothing else — `worker.js:50-52`
- Guard: `Number(env.RETENTION_DAYS)`, early return unless finite and > 0 — `worker.js:809-810`
- Cutoff is a **local day string**, not a timestamp — `daysAgo(env, days)` at `worker.js:811`,
  which routes through `TZ_OFFSET` (`worker.js:691-693`, `:681-684`)
- Two deletes, `clicks` then `conversions`, both `WHERE ts_day < ?` — `worker.js:813-814`
- One try/catch around both, so a missing `conversions` table cannot abort the sweep, but a
  failure *between* the two leaves clicks pruned and conversions not — `worker.js:812-815`

**Connected to.**
- **owns:** nothing today. When enabled, it owns the lifetime of every analytics row.
- **owned-by:** `wrangler.toml`'s `[triggers]` block — a `scheduled` export without one is inert
- **joins:** deletes by `ts_day` (`schema.sql:36`, `:63`), the same denormalised local-day column
  `recordClick` writes at `worker.js:181`
- **looks-like-but-is-not:** `apiDelete` (`worker.js:414-421`). Both delete from `clicks` and
  `conversions`, both tolerate a missing `conversions` table. `apiDelete` removes one link's
  entire history by `link_id` and then invalidates the KV entry (`worker.js:419`); this one
  removes *all* links' aged rows by day and invalidates nothing — correctly, since KV caches
  `links` rows, not clicks. A reader fixing one has not fixed the other.

**If you change this.**
- **Hits:** `TZ_OFFSET` semantics. The cutoff is a local-day string compared against
  local-day strings, so changing `TZ_OFFSET` (`wrangler.toml:18`) shifts the boundary of what
  this deletes — the two are coupled through `daysAgo` and nothing names that coupling.
- **Hits:** every historical number. `apiOverview`'s all-time totals (`worker.js:314`) and
  `apiStats`'s lifetime `total` (`worker.js:448-450`) are unbounded `COUNT(*)`; enabling
  retention makes them shrink retroactively with no record that it happened.
- **Does not hit:** the `links` table. The obvious wrong guess — "retention" sounds like it
  expires links, and `links` has an `expires_at` column sitting right there (`schema.sql:19`).
  It does not: `worker.js:813-814` names only `clicks` and `conversions`. Link expiry is a
  read-time gate at `worker.js:67`, unrelated code, unrelated trigger.
- **Does not hit:** `handleRedirect`. `scheduled` and `fetch` are separate exports
  (`worker.js:17`, `:50`); enabling the cron cannot change redirect behaviour.

**Surfaces.** No human, no agent — the platform would be the only caller, and today there is
none. A human enables it by editing `wrangler.toml` twice (line 24 and lines 42-43).

**See.** `worker.js:807-816`
