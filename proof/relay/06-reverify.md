# 06 · Re-verify — the Hits / Does-not-hit, ripped a second time

Step 6 of the audit order (`README.md:41`): "A wrong waterfall costs more than a missing card."
Each claim below was re-checked against the tree after the cards were written, not from memory.

| Claim | Command | Result | Verdict |
|---|---|---|---|
| Analytics never go through the KV cache (`binding-links-kv.md`, Does-not-hit) | `grep -n "lookupLink" worker.js` | three hits: `:62` (redirect), `:221` (`/track`), `:748` (the definition). Neither `apiStats` (`:423`) nor `apiOverview` (`:311`) nor `apiExport` (`:780`) is among them. | **holds** |
| `invalidate` has exactly three call sites | `grep -n "invalidate" worker.js` | `:409`, `:410`, `:419`, plus `:763` (definition) | **holds** |
| `skipTracking` is not a gate | `grep -n "skipTracking" worker.js` | `:91` (assigned), `:94` (guards the click write), `:102` (guards the interstitial). No `return` uses it; `worker.js:105` redirects regardless. | **holds** |
| `recordClick` has one caller and it is inside `waitUntil` | `grep -n "recordClick" worker.js` | `:96` (the only call, wrapped by `ctx.waitUntil` at `:95`), `:160` (definition), `:187` (its own log line) | **holds** |
| the `scheduled` handler has no live trigger | `grep -rn "crons\|\[triggers\]" . --exclude-dir=.git` | 5 lines, all comments or docs — `wrangler.toml:42`, `:43`, `worker.js:49`, `README.md:239`, `README.zh-TW.md:239` | **holds — ghost confirmed** |
| `LINKS_KV` is declared nowhere | `grep -rn "LINKS_KV" . --exclude-dir=.git` | code reads at `worker.js:749`, `:750`, `:755`, `:764`, `:765`; declaration at `wrangler.toml:36-38` **commented**; docs at `wrangler.toml:35`, `README.md:238` | **holds — ghost confirmed** |
| `tzOffsetHours`'s export is unused | `grep -rn "tzOffsetHours" . --exclude-dir=.git` | `worker.js:681`, `:686`, `:689`, `:861`. `test/unit.test.mjs:5-8` imports eleven helpers, not this one. | **holds**, but it is not a noun — logged as open question 1 |
| `geo` is live despite the schema comment | read `schema.sql:10` vs `worker.js:129`, `:476`, `index.html:2874` | comment lists three modes; code accepts and routes a fourth; the dashboard exposes it | **the comment is stale. The code wins** (`identity.md:11`) |

## One correction made during re-verification

`objects/secret-admin-token.md` first cited `DASH_ORIGIN` at `wrangler.toml:17`. That line is a
comment; the assignment is `wrangler.toml:16`. Corrected before publication. Recorded here
because a `status: verified` that hides its misses is worth less than one that does not
(`reference.md:65-67`).

## Not re-verified

Nothing in `index.html` beyond the six lines cited (`:2492-2494`, `:2500`, `:2515`, `:2826`,
`:2874`). It is 3020 lines and outside the deploy; the map treats it as a named client, not as
territory.
