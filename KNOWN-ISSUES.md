# KNOWN-ISSUES.md

What is wrong with this instrument right now, dated, with the evidence. Read this before believing anything in the README.

---

## The falsification test — what would prove this worthless

**If a reader could get the same answer by pasting the whole Worker into a model and asking "explain this", the cartographer has failed.** That is the bar, stated before the results, so it can be used against this build rather than for it.

It has been run once, and not by me. The agent that walked `relay` invented this test on its own and reported it in `proof/relay/07-friction.md`: `relay`'s own README is 15KB and genuinely good, so it checked whether the four facts a changer actually needs appear in it.

1. the `clicks` INSERT bind is positional (`worker.js:176-184`), so inserting a column corrupts data silently — **not in the README**
2. `skipTracking` looks like a gate and is not (`worker.js:91` vs `:105`) — **not in the README**
3. adding a top-level route requires adding it to `RESERVED` (`worker.js:14`) — **not in the README**
4. rotating `ADMIN_TOKEN` breaks unique-visitor continuity via `env.SALT || env.ADMIN_TOKEN` (`worker.js:172`) — **not in the README**

Four for four. Its conclusion: *"the README explains what Relay does; none of it tells you what breaks when you change something."*

**What this does not settle.** One territory, one run, and the comparison was against a README rather than against a model given the full source. The honest version of this test — paste all 862 lines into a cold model, ask what breaks if you add a column to `clicks`, and compare — has not been run. Until it is, the bar is stated and only half-cleared.

---

## The proof maps fail the current checker, on purpose, and here is the chain

`node verify.mjs proof/relay --subject <relay clone>` reports **6 failures**. `proof/temp-mail` reports **12**. Every one of them is the same check: `verified-needs-commit`.

That is not a defect in the maps. It is the loop working, and the sequence matters:

1. The two maps in `proof/` were produced by cold agents against v1 of this instrument. v1's `reference.md` asked for `status: verified <date>` and nothing else.
2. The agent that walked `relay` filed this in its friction report: *"`reference.md:65` asks for a date but never a commit. A `path:line` map goes stale the instant someone edits the file, and the date does not pin the tree. For a map whose entire value is line-precision, that is a real gap — I wrote `verified 2026-08-16` knowing it is weaker than it looks."*
3. The rule was changed. `verified` now requires a date **and** a commit.
4. The checker enforces it, and correctly flags every card written under the old rule.

The maps have not been retro-fitted to hide this. Re-running the walk against the current instrument would produce cards with commits; the fastest way to see whether the fix works is to do exactly that.

**What this does not prove:** that the commit requirement is sufficient. A commit pins the tree at write time; nothing yet re-checks whether the pinned commit is still the tip.

---

## Eleven defects the cold agents found — status

Two agents walked public Workers (`temp-mail`, `relay`) with no memory of this build, and were asked for friction rather than praise. Their raw reports are in `proof/*/friction.md`. What they found:

| # | Defect | Status |
|---|---|---|
| 1 | `README` sent the reader to `reference.md` for the audit order, which lives in `README`. `reference.md` had a section called "Walk order" that is the *reader's* order — a cold model lands there and produces a catalog and one card instead of a six-step audit | **fixed** — the audit order is named as being in `README`; the reader's order is retitled and scoped |
| 2 | `secret` and `ghost` had the same test (`env.X` absent from config) | **fixed** — three env shapes are now distinguished, and the most common one (optional var with a code-side default) is neither |
| 3 | Load order was impossible: `reference.md` was to be opened "when writing cards", but step 2 needs its tables | **fixed** — load list says step 2 |
| 3b | The instrument pointed at an `open-questions.md` it never produced: no step owned it, no template existed. The `temp-mail` agent wrote `07-friction.md` because it had to invent a home | **fixed late, and it was marked fixed too early.** The first pass only *named* the file in the audit order, which is not the same as producing it — the gap was found by grepping this repo's own file references and finding one that resolved to nothing. `_templates/open-questions.md` now exists. **The two maps in `proof/` predate it** and carry their findings in `07-friction.md` instead |
| 4 | `src/` was asserted as a shape requirement three times; `relay`'s entry is a root-level `worker.js` | **fixed** — the entry is whatever `main` names |
| 5 | The card header (`type · card · universe · status`) was mandatory and documented nowhere except the example the README says not to copy | **fixed** — specified in `reference.md` |
| 6 | `route` failed the instrument's own noun test; 28 branches would be 28 photocopies of an `if` | **fixed** — route maps as one surface card |
| 7 | Step 5 duplicated step 2, which `reference.md` forbids | **fixed** — step 5 names cards, never repeats waterfalls |
| 8 | "Stop after each step" is impossible for a delegated single-pass agent | **fixed** — the instrument now says what to do instead, and to declare that no checkpoint was taken |
| 9 | No universe for "declared and reachable but does nothing" | **fixed** — `inert` added |
| 10 | "Deliberate ghost" was defined only as fail-closed; `relay`'s two are fail-open-to-a-default — same label, inverted consequence | **fixed** — both flavours named |
| 11 | A `binding` marked `ghost` cannot cite a read site, which the citation rule demanded | **fixed** — negative citation plus a live contrast |

**Not fixed, and open:**

- **`config-record` matched nothing in either public territory.** The instrument covers "something fits no card type"; it says nothing about a card type that fits nothing. Both agents raised it independently.
- **`examples.md` demonstrates the one noun type neither public Worker had.** Its longest card is a `config-record`, which is the type least useful to the two territories that actually tested this. Known, not yet resolved.
- **The checker's citation resolution accepts a basename.** A card that cites `inboxes.js` for a file at `src/server/inboxes.js` passes when exactly one file in the tree answers to that name. That is how developers write and it kept 248 false failures out of the `temp-mail` run — but it is more permissive than "the citation resolves", and a tree with two same-named files gets flagged as ambiguous rather than resolved.
- **Nothing checks that a `Does not hit` is *true*.** The checker enforces that the field is present and non-trivial. Whether the named neighbour is actually untouched is a claim only a reader can falsify. This is the largest gap between what the checker verifies and what the map asserts.

- **`examples.md` (107 lines) is still longer than `rules.md` (93).** Declared rather than gamed: it holds three cards with all seven sections each, which is what the brief asks for, and trimming further would cost the sections rather than the prose. It is under `rules.md` + `reference.md` combined (174), and the full maps live in `proof/` rather than here. Flagged because "examples larger than rules" is a named failure in this competition's history and the line has not been cleared, only argued.

- **Two checks have no negative fixture**, both degenerate cases (an empty directory; a map with no catalog file at all). `--selftest` prints them with the reason rather than counting them as covered. Shrinking that list is real work, not bookkeeping.

---

## What the checker does not do

It does not read code semantics. It verifies that a citation resolves to a real line, that a card has its seven sections, that a ghost carries its grep, that a waterfall names both halves, and that `verified` pins a commit. Everything a card *says* about the code is outside its reach.

Where evidence is unreachable — no `--subject` given, a private tree — it reports `UNVERIFIABLE` and says why. It never converts "I could not look" into "this is wrong."

---

*Last run: 2026-08-16. `node verify.mjs --selftest` → 6/6, each fixture failing on its own named check.*
