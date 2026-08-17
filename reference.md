# reference.md

## Card format

Every card opens with a header line, then the seven sections. Both are required; a card missing either is a stub, and `status: stub` is an honest state.

```
type: object | process · card: <one of the twelve> · universe: live | leftover | ghost | inert · status: stub | verified <date> @ <commit> | stale <date>
```

`type` says whether it is a noun or a movement. `card` says which of the twelve. Together they place it in the closed set below.

### The seven sections

1. **One sentence** — and if the product word and the code name differ, both.
2. **Why this shape** — the load-bearing reason. Not a field tour.
3. **Shape** — keys, constraints, or owning files, each with `path:line`.
4. **Connected to** — `owns` / `owned-by` / `joins` / `looks-like-but-is-not`.
5. **If you change this** — Hits / Does not hit.
6. **Surfaces** — who reads and who writes: humans, agents, code, or none.
7. **See** — the source file. One link, not another essay.

`looks-like-but-is-not` is where collisions get settled card-side. Use it hard: it is the field that stops a reader from editing the wrong file.

## The closed card set

Twelve types. Closed means closed — something that fits none of them is information about the territory, not a reason for a thirteenth. Write it in `open-questions.md` (audit step 6) and move on.

### Nouns

| Type | One line |
|---|---|
| `entry` | The handler the platform calls |
| `binding` | A resource reached through `env` |
| `route` | A surface the entry branches on |
| `table` | Persisted state outliving the request |
| `config-record` | One file or row per instance, uniform shape |
| `secret` | Read from `env`, no default, not in the repo |

### Movements

| Type | One line | Typical evidence |
|---|---|---|
| `verify` | Proves the caller is who they claim | signature check, token compare |
| `resolve` | Raw request → an identity | header/payload → id |
| `gate` | Ends the run, or lets it continue | early return, throw, short-circuit |
| `render` | Data → a payload for something else | template fill, response body |
| `persist` | Writes state that survives | `INSERT`/`UPDATE`, `KV.put` |
| `schedule` | What a trigger starts | the `scheduled` handler + its cron |

## Evidence rules

**A card may not assert what it cannot cite.** If you cannot point at `path:line`, there is no finding — leave the field empty and say why (`rules.md` §absent vs undocumented). A confident sentence with no citation is worse than a gap, because a gap is visible.

**`status: verified` needs a date and a commit.** Not one or the other. A `path:line` map goes stale the moment someone edits the file, and a date alone does not pin the tree. `stale <date>` is a legitimate downgrade and always better than a confident wrong pin.

**A `ghost` card carries the grep that proves it** — the command and its output, in the card. See `rules.md` §ghosts.

**A `binding` marked `ghost` cannot cite a read site**, because having none is the whole finding. Cite the config block, then the negative grep, then one live binding from the same tree as contrast. That contrast is what makes the absence legible instead of merely asserted.

## Clustering cards

**Group by what a thing is, not what it is about.** A file named `billing-webhook.js` is an `entry`, not a "billing" card; a table called `sessions` is a `table`, not an "auth" card. Subject-clustering feels natural and rots fast, because the subject of a file changes when the product changes while its form does not.

The trap has a shape: something that *reads like* the domain it mentions. When a card could go in two clusters, the tie-break is what a reader would open it **to change** — and if that is still ambiguous, its type wins.

**A cluster the cartographer proposed is not a cluster until the owner accepts it.** Write proposals as proposals in the catalog. Otherwise last run's guess silently becomes this run's structure, and nobody remembers it was ever a guess.

## Naming collisions — the three sources

Every Worker collides names from three directions at once. Check all three before writing the catalog.

**Platform vs. code.** A binding has one name in the deploy config and a different real name behind it. Write both.

**Product vs. code.** What the business calls the thing is rarely the table name. State the pair once in the catalog, then use the code name throughout.

**Worker vs. Worker.** The expensive one. Two Workers under one product name, separate deploys, separate databases, overlapping vocabulary. The map covers one deploy. Name the sibling explicitly with the sentence "this map does not cover it" — otherwise a reader carries a fact across and it is wrong on arrival.

## How the finished map is read

Different from how it is built. The build order is in `README.md`; this is the **reader's** order, and it belongs in the map you produce:

1. **The catalog** — what the nouns are and what the colliding names mean, answerable without opening a card.
2. **One card** — the one matching the question.
3. **Stop.**

**Never load the whole objects folder.** The catalog exists so nobody has to. A reader who loads every card has cancelled the map and gone back to reading the source with extra steps.

For a change, the catalog points at which cards to open. It **names** them; it never repeats their waterfalls, because two copies of a waterfall drift and the copy is always the one that goes stale.
