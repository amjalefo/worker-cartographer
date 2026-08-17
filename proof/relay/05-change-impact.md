# 05 · Change impact — which cards to open before which change

Pointers only. The waterfalls live in the cards; two copies drift (`reference.md:49`).

| If you are about to… | Open, in this order | The trap |
|---|---|---|
| add or rename a column in `clicks` | `objects/table-clicks.md` → `movements/persist-click.md` | the INSERT bind is **positional** (`worker.js:176-184`) and `apiExport` hard-codes its columns (`worker.js:787`) |
| add a redirect mode (a fifth after `simple`/`ab`/`device`/`geo`) | `objects/_stubs.md` → the `pick target` and `links` rows | two places, not one: `pickTarget` (`worker.js:108-140`) reads it, `normFields` (`worker.js:476`) whitelists it. `schema.sql:10` is already stale and will not tell you. |
| change how a visitor is counted as unique | `objects/secret-admin-token.md` → `objects/table-clicks.md` | the salt chain `env.SALT \|\| env.ADMIN_TOKEN` (`worker.js:172`) makes token rotation a data event |
| add a new top-level route | `movements/gate-redirect.md` | add it to `RESERVED` (`worker.js:14`) in the same commit, or a slug can shadow it |
| turn on the edge cache | `objects/binding-links-kv.md` | `invalidate` has exactly three call sites (`worker.js:409`, `:410`, `:419`); any new write path to `links` needs a fourth |
| turn on retention | `movements/schedule-prune.md` | two switches (`wrangler.toml:24` and `:42-43`), and all-time totals shrink retroactively |
| tighten who may call the API | `objects/secret-admin-token.md` | `DASH_ORIGIN` / `corsHeaders` (`worker.js:822-832`) is not an access control; the check is `worker.js:269` |
| stop tracking bots or honour DNT differently | `movements/gate-redirect.md` (the *looks-like-but-is-not*) → `movements/persist-click.md` | `skipTracking` (`worker.js:91`) is **not** a gate; making it one stops redirects for crawlers |
| change the dashboard | nothing in this map | `index.html` is not in the deploy (`worker.js:39-43`); only the API response shapes couple them |
| change anything in `tools/` | nothing in this map | outside the territory — offline CLIs over exported JSON |

## Open questions — things that did not fit the closed set

Recorded rather than given a thirteenth type (`reference.md:5`).

1. **The unused named export.** `tzOffsetHours` is exported at `worker.js:861` and imported by
   nobody: `grep -rn "tzOffsetHours" .` returns only `worker.js:681`, `:686`, `:689`, `:861`,
   and `test/unit.test.mjs:5-8` imports eleven helpers without it. By `rules.md:41` "an export
   with no import" is a ghost — but the *function* is live (`worker.js:686`, `:689`), only its
   export surface is dead, and it is not a noun at all under `rules.md:5` because it does not
   survive a request. Left as an observation.
2. **The test surface has no card type.** `test/unit.test.mjs` + `.github/workflows/ci.yml:17`
   constrain the Worker's helpers — renaming `pickTarget` breaks CI. Neither a noun nor a
   movement.
3. **`schema.sql` itself.** It defines three `table` nouns but is not applied by the deploy;
   a human runs it (`schema.sql:2`). The drift it permits is why four separate read paths
   defend against an out-of-date database (`worker.js:186`, `:242`, `:322`, `:776`).
