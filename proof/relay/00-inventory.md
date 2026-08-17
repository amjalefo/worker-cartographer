# 00 · Inventory — relay

Territory: `territories/relay/` · github.com/YuriCrystal/relay
Walked 2026-08-16. One deploy: `name = "relay"`, `main = "worker.js"` (`wrangler.toml:1-2`).

## Is this a walkable territory?

Yes, with one deviation from `identity.md:15-20`, which asks for "a `src/` with an entry".
There is no `src/`. The entry is a single root-level file, `worker.js`, named by
`wrangler.toml:2`. The shape test that matters — one `wrangler.toml`, one entry exporting
`fetch`, one D1 schema — passes. Noted rather than blocked; see the friction log.

## The tree, classified

| Path | In the deploy? | Universe | Evidence |
|---|---|---|---|
| `worker.js` (862 ln) | yes — the bundle | `live` | `wrangler.toml:2` |
| `wrangler.toml` (49 ln) | yes — bindings + triggers | `live` | — |
| `schema.sql` (66 ln) | no — run by hand against D1 | `live` (state it defines outlives every request) | `schema.sql:2` |
| `index.html` (3020 ln) | **no** | `live`, but a **separate artifact** | the Worker's root path returns the string `Relay`, not this file — `worker.js:39-43` |
| `test/unit.test.mjs` | no | `live` (CI) | `.github/workflows/ci.yml:17` runs `node --test` |
| `tools/rank.mjs`, `tools/pick-formula.mjs`, `tools/formulas.json`, `tools/sample.stats.json`, `tools/CREDITS.md` | no | **outside the territory** — offline Node CLIs that consume the API's *output* | `tools/rank.mjs:6-8` reads a file or stdin |
| `README.md`, `README.zh-TW.md`, `LICENSE`, `.gitignore` | no | docs | — |

## Not-wired list, with the grep behind each

Everything below is named in code **and** commented out or absent in `wrangler.toml`.
All of it is optional-by-design, not rot.

| Name | Read at | Declared? | Verdict |
|---|---|---|---|
| `LINKS_KV` | `worker.js:749`, `:750`, `:755`, `:764`, `:765` | `wrangler.toml:36-38` — all three lines commented | `ghost` binding, **deliberate**: `lookupLink` falls through to D1 (`worker.js:759`) |
| `CACHE_TTL` | `worker.js:754` | `wrangler.toml:26` — commented | `ghost` var, **deliberate**: `Math.max(60, Number(env.CACHE_TTL) \|\| 60)` makes absence mean 60 |
| the `scheduled` handler | `worker.js:50-52` | `grep -rn "crons\|\[triggers\]"` over the tree returns only `wrangler.toml:42-43` (both commented), `worker.js:49` (a comment), and two README lines (`README.md:239`, `README.zh-TW.md:239`) — **no live cron** | `ghost` movement as shipped |
| `RETENTION_DAYS` | `worker.js:809` | `wrangler.toml:24` — declared, **empty string** | `live` binding, inert value: `pruneOld` returns early (`worker.js:810`) |
| `database_id` | — | `wrangler.toml:11` — commented | intentional: the Deploy button fills it (`wrangler.toml:6`) |
| `tzOffsetHours` as a *named export* | `worker.js:861` | `grep -rn "tzOffsetHours" .` → only `worker.js:681`, `:686`, `:689`, `:861`. `test/unit.test.mjs:5-8` imports eleven helpers and **not** this one | export unused; the function itself is live (called at `:686`, `:689`). Not a noun — see open questions. |

## Deliberately *not* a ghost

`geo` mode. `schema.sql:10` says `simple | ab | device`. The code accepts a fourth,
`geo`, at `worker.js:476` and routes it at `worker.js:129-137`, and the dashboard offers it
(`index.html:2874`). **The code wins; the schema comment is stale.** This is exactly the
failure `rules.md:39` warns about — a comment claiming something is not there while call
sites use it.
