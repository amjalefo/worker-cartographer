# Stubs

Named, anchored, not filled. `status: stub` is the normal state (`reference.md:31`).

| Card | Type | Universe | Anchor | Why not filled |
|---|---|---|---|---|
| the entry | `entry` | live | `worker.js:16-53` | Six branches in 37 lines; the catalog's route table already answers "which branch". |
| `DB` | `binding` | live | `wrangler.toml:8-10` · `worker.js:175` | Uncontroversial. Its one non-obvious fact — binding name `DB` vs `database_name = "relay"` — is in the catalog's collision table. |
| `/api/*` | `route` | live | `worker.js:29-31`, dispatch `:274-305` | Six sub-routes; `README.md:145` already tabulates them. |
| `/track` | `route` | live | `worker.js:34-36`, handler `:194-239` | Its load-bearing fact — absent `CONVERSION_TOKEN` means **open** — is carried in the `ADMIN_TOKEN` card's *looks-like-but-is-not*. |
| `/:slug`, `/:slug/:suffix` | `route` | live | `worker.js:46`, `:57-59` | Covered by `movements/gate-redirect.md`. |
| `/robots.txt` | `route` | live | `worker.js:22-26` | Four lines, no dependents. |
| `links` | `table` | live | `schema.sql:6-26` | Would be the fourth full card. Note for whoever fills it: `mode` accepts `geo`, which `schema.sql:10` does not mention — code wins. |
| `conversions` | `table` | live | `schema.sql:54-66` | Every read is try/catch-wrapped for absence (`worker.js:242`, `:255-257`, `:322`, `:417`); a full card should lead with that. |
| `SALT` | `secret` | live, optional | `worker.js:172` | Falls back to `ADMIN_TOKEN`; consequence documented in that card. |
| `CONVERSION_TOKEN` | `secret` | live, optional | `worker.js:215-218` | Absent = open. |
| `SAFEBROWSING_KEY` | `secret` | live, optional | `worker.js:719`, `:722` | Absent = skipped; a failed lookup also fails **open** (`worker.js:737`). |
| destination gate | `gate` | live | `worker.js:519-524` | Write-time; throws into a 400 at `worker.js:306-308`. |
| pick target | `resolve` | live | `worker.js:108-140` | Four modes; the `variant` collision is in the catalog. |
| bearer verify | `verify` | live | `worker.js:267-271` | Fully described inside `objects/secret-admin-token.md`. |
| interstitial | `render` | live | `worker.js:579-601` | Emits FB/GA4/GTM from `links.pixel_*`; only reachable when a pixel is set and `skipTracking` is false (`worker.js:101-104`). |
| export | `render` | live | `worker.js:780-805` | CSV column list at `worker.js:787` is the coupling worth knowing; already flagged from `clicks`. |
