# Friction report — relay

Written by the agent that walked this territory, verbatim from its final response. It was asked for friction rather than praise, and told that "it worked great" would be useless.

At the time of this walk the instrument was v1. Defects A–D, F, G, I and J have since been fixed; see `../../KNOWN-ISSUES.md` for which, and which remain open.

---

**A. `README.md:15` points at the wrong file, and the file it points at has a decoy section.** The cold-start prompt says "Follow the audit order in `reference.md`." There is no audit order in `reference.md`. The audit order is in `README.md:32-42`. What `reference.md` *does* have, at `:43-51`, is a section headed **"Walk order"** — which is the *reader's* order (catalog → one card → stop), a completely different thing for a completely different person. A cold model following `README.md:15` literally lands on `reference.md:43`, finds a plausibly-named three-step list, and produces a catalog and one card instead of a six-step audit. This is the single worst defect in the instrument.

**B. The load order is impossible as written.** `README.md:21` says open `reference.md` "when writing cards, not before." But audit step 2 (`README.md:37`) is the catalog, which must name the closed noun and movement set and resolve the three-source collisions — and the movement table (`reference.md:18-27`) and the Worker-specific collision taxonomy (`reference.md:53-61`) exist *only* in `reference.md`. `rules.md:9-16` has the noun table but explicitly defers the authoritative version ("`reference.md` holds the table") and has no movement table at all beyond a bare list of six verbs (`rules.md:24`). I opened `reference.md` at step 2 in violation of `README.md:21`, because step 2 cannot be done otherwise.

**C. `src/` is asserted as a shape requirement three times and Relay doesn't have one.** `identity.md:17`, `reference.md:11`, and `README.md:7` all say the entry lives in `src/`. Relay's entry is root-level `worker.js`, named by `wrangler.toml:2`. `identity.md:21` says that when the shape doesn't fit, "say so and stop." I judged that "the file `main` points at" is what was meant and continued — but the instrument gave me no license to make that call, and a more literal reader would have refused a perfectly valid Worker. The rule should be phrased against `main`, not against a directory name.

**D. `rules.md:41` names a ghost species that the noun table cannot hold.** It lists "an export with no import" as a ghost. Relay has exactly one: `tzOffsetHours`, exported at `worker.js:861`, imported by nobody (`test/unit.test.mjs:5-8` takes eleven helpers and not that one). But `ghost` is a *universe* that attaches to a card, cards come in twelve types, and a function is none of them — `rules.md:5` explicitly rules it out ("if it exists only inside one invocation, it is not a noun"). So `rules.md:41` and `rules.md:5` contradict each other on this exact case. I logged it as an open question rather than invent a thirteenth type.

**E. Three real things in this repo have no type, and two of them are large.**
- `index.html`, 3020 lines, first-party, in the repo, **not in the deploy** (`worker.js:39-43` proves the Worker never serves it). Not a `route`, not a `config-record`, not a `binding`. I filed it in the collision table as "a named client." That is a workaround, not a fit.
- `tools/` — 26KB of offline Node CLIs (`rank.mjs`, `pick-formula.mjs`, `formulas.json`) that consume the API's exported JSON. Outside the territory by `README.md:9`, but they are *in the repo the user points you at*, and the instrument's only advice for a repo containing non-Worker code is "point at a Rails app and stop." Neither "stop" nor "map it" is right here.
- `test/unit.test.mjs` + `.github/workflows/ci.yml:17`. Renaming `pickTarget` breaks CI. That is a real change-impact edge with no card type to carry it.

**F. The universe set is missing a state: declared-but-inert.** `RETENTION_DAYS` is declared at `wrangler.toml:24` as an empty string. It is not a `ghost` (`rules.md:41` requires undeclared), not `leftover`, and calling it `live` implies it does something — `pruneOld` returns at `worker.js:810` before touching a row. I invented the phrase "live binding, inert value." The instrument gave me nothing.

**G. "Ghost, but deliberate" is defined too narrowly.** `rules.md:41` explains deliberate ghosts as **fail-closed by absence** — "the path cannot exist in production," "a ghost that protects." Relay's two deliberate ghosts are the opposite: `LINKS_KV` and `CACHE_TTL` are absent so the code takes a *default* (D1 direct, TTL 60). That is fail-open-to-a-default, not fail-closed. Same label, inverted semantics. I stretched the phrase; the instrument should carry both.

**H. Hits / Does-not-hit is under-specified for a ghost card.** `rules.md:50` forbids leaving Does-not-hit blank. For `LINKS_KV` — a thing that does not exist in the deploy — nothing it "hits" is real. I answered the counterfactual ("what changes if you bind it") because the alternative was a vacuous card. The instrument never says whether a ghost card's waterfall is present-tense or conditional.

**I. `reference.md:65` asks for a date but never a commit.** "`status: verified` requires a date and a citation." A `path:line` map goes stale the instant someone edits the file, and the date does not pin the tree. No field asks for a SHA. For a map whose entire value is line-precision, that is a real gap — I wrote `verified 2026-08-16` knowing it is weaker than it looks.

**J. `README.md:34` cannot be honoured in a delegated run.** "Stop after each step and let a person read the output before the next one starts," and `README.md:16` "Stop after the catalog and show me." I was tasked with producing the whole map in one pass and there was no human in the loop to stop for. I ran all six steps. Flagging it because the instrument's quality control *is* the human checkpoint, and a non-interactive run silently removes it.

**K. The one worked example demonstrates the one noun type this territory lacks.** `examples.md` is built end-to-end around a multi-tenant `config-record` territory (a JSON per clinic), and its longest, best card is the config-record card. Relay has **zero** config-records. The shape reference was least useful for exactly the type mix I had, and `README.md:22`'s warning ("if your first card looks like its first card, you copied") was easy to obey only because there was nothing to copy.

---

## Was the method overkill for this territory?

**First, a correction to the premise I was given.** I was asked whether the instrument claims "a map should not be scaffolded for a tree that a single file could explain." I ran `grep -rni "scaffold|single file|overkill|too small|not worth"` across all four instrument files. **Zero hits.** That judgment call is nowhere in `worker-cartographer/`. The instrument's only sizing statement is the opposite one — `identity.md:23` / `README.md:7`: "Size is not the limit; a single deploy is. One Worker, however large." It has a floor for *scope* and no floor for *size*. So I hit the judgment call, and the instrument did not help me make it.

**What I decided.** I mapped it — but wrote 6 full cards out of 25 named nouns and movements, pushing 16 to `objects/_stubs.md` with an anchor and a one-line reason each.

**The falsifiable test I used.** Relay's own `README.md` is 15,075 bytes and genuinely good. If the map only restated it, the map was overkill. So I checked whether the four facts a changer actually needs appear in it:

1. the `clicks` INSERT bind is **positional** (`worker.js:176-184`), so a column insert corrupts data silently — **not in `README.md`**
2. `skipTracking` is not a gate (`worker.js:91` vs `:105`) — **not in `README.md`**
3. adding a top-level route requires adding it to `RESERVED` (`worker.js:14`) — **not in `README.md`**
4. rotating `ADMIN_TOKEN` breaks unique-visitor continuity via `env.SALT || env.ADMIN_TOKEN` (`worker.js:172`) — **not in `README.md`**

Four for four. The README explains what Relay *does*; none of it tells you what breaks when you change something.

**Where it was overkill anyway.** The six-file split is heavier than 862 lines of source deserves. For a territory this size the honest shape is one file with a collision table, a ghost list, and four cards. I kept the six-file structure because I was asked to follow the audit order and each step is a named deliverable; I would not choose it again for a Worker under ~1000 lines. The instrument should say that and does not.
