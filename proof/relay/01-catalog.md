# 01 · Catalog — relay

Answers "what is X" without opening a card. Open exactly one card when the question needs it.
**Never load `objects/` wholesale** (`reference.md:51`).

---

## Colliding names — first, because they cost the most

| The word | Means here | Also means | This map covers |
|---|---|---|---|
| `DB` | the binding name every query goes through (`worker.js:175`, `:312`) | a D1 database whose real name is `relay` — `binding = "DB"` / `database_name = "relay"` (`wrangler.toml:9-10`). Same product word as the Worker itself. | both names, stated once |
| `suffix` | a column (`schema.sql:33`) and a URL segment `/:slug/:suffix` (`worker.js:59`) | product word is **"KOL" / "channel"** — `README.md:186` calls it "the channel/KOL tag" | the pair, then `suffix` everywhere |
| `variant` | a column (`schema.sql:34`) holding whatever branch actually fired | three different things depending on `mode`: an A/B `label` (`worker.js:117`), a device string `ios`/`android` (`worker.js:124-125`), or `geo:XX` (`worker.js:134`) | one column, three vocabularies — do not assume A/B |
| `track` | the public postback route `/track` (`worker.js:34`) | also a **reserved slug** — `RESERVED` at `worker.js:14` contains `'track'`, so no link can ever own that short code (`worker.js:60`) | both; the reservation is why the route is safe |
| `TZ_OFFSET` | a `[vars]` **string** `"8"` (`wrangler.toml:18`) | a **number** everywhere in code, coerced at `worker.js:682` | it is a string in config and a number in code; a non-numeric value silently becomes +8 (`worker.js:683`) |
| "the dashboard" | `index.html`, a standalone file the user opens themselves | **not served by this Worker** — root returns the literal string `Relay` (`worker.js:39-43`); the file talks to the Worker cross-origin over `state.base` (`index.html:2515`) | the Worker only. `index.html` is a client of it, named here so nobody looks for a route that serves it. |

**Worker vs. Worker.** There is no sibling Worker. One deploy, one `wrangler.toml`, one
`main` (`wrangler.toml:1-2`). The `tools/` directory looks like a second surface and is not:
`rank.mjs` and `pick-formula.mjs` are offline Node CLIs run by a human against exported JSON
(`tools/rank.mjs:6-8`). **This map does not cover them** and no change to them can reach the deploy.

---

## Nouns

| Card | Type | Universe | Anchor |
|---|---|---|---|
| the entry | `entry` | live | `worker.js:16-53` — `fetch` + `scheduled` |
| `DB` | `binding` | live | `wrangler.toml:8-10` · read `worker.js:175` |
| `LINKS_KV` | `binding` | **ghost, deliberate** | `wrangler.toml:36-38` commented · read `worker.js:749` |
| `/api/*` | `route` | live | `worker.js:29-31` |
| `/track` | `route` | live | `worker.js:34-36` |
| `/:slug` · `/:slug/:suffix` | `route` | live | `worker.js:46`, `:57-59` |
| `/robots.txt` | `route` | live | `worker.js:22-26` |
| `links` | `table` | live | `schema.sql:6-26` |
| `clicks` | `table` | live | `schema.sql:29-51` |
| `conversions` | `table` | live | `schema.sql:54-66` |
| `ADMIN_TOKEN` | `secret` | live — **the only required one** | `worker.js:269` |
| `SALT` · `CONVERSION_TOKEN` · `SAFEBROWSING_KEY` | `secret` | live, all optional | `worker.js:172`, `:215`, `:719` |

Cards written in full: `clicks`, `LINKS_KV`, `ADMIN_TOKEN`. Everything else is `status: stub`
— the normal state of a map, not an unfinished one (`reference.md:31`).

**No `config-record` exists in this territory.** There is no per-instance file and no
per-instance row: `links` rows are user content, not instance configuration. Stated so a
reader stops looking for the tenant file that the noun type implies.

---

## Movements — only the ones that actually run

Traced from one real redirect request, `worker.js:17` → `:46` → `:57`:

`resolve` (slug → link row, `worker.js:62`) → `gate` ×3 (`:60`, `:64`, `:67`, `:72`) →
`resolve` (mode → destination, `worker.js:85`) → `render` (UTM, `:88`) →
`persist` (click, `:95`, non-blocking) → `render` (interstitial, `:103`) *or* redirect (`:105`)

The `/api/*` path adds `verify` (`worker.js:267-271`) and a write-time `gate`
(`worker.js:519-524`). `/track` adds an optional `verify` (`worker.js:215-218`) and a
`persist` (`worker.js:226-233`).

| Card | Type | Universe |
|---|---|---|
| the four redirect gates | `gate` | live — `movements/gate-redirect.md` |
| bearer verify | `verify` | live — `movements/verify-admin.md` |
| record click | `persist` | live — `movements/persist-click.md` |
| destination gate (blocklist + Safe Browsing) | `gate` | stub — `worker.js:519-524` |
| pick target | `resolve` | stub — `worker.js:108-140` |
| interstitial | `render` | stub — `worker.js:579-601` |
| prune old | `schedule` | **ghost** — handler at `worker.js:50-52`, no live cron |

**The trap, said out loud.** `skipTracking` (`worker.js:91`) reads like a gate and is not one.
A bot or a DNT visitor is still redirected (`worker.js:105`); only the click write and the
pixel page are skipped (`worker.js:94`, `:102`). Turning it into an early return would make
Relay stop redirecting for every link-preview crawler — the exact inversion `rules.md:31` warns about.
