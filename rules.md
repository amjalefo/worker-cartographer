# rules.md

## What counts as a noun

A thing with a name that exists outside any single invocation. If it only exists inside one request, it is a local variable and belongs in a movement card, if anywhere.

Six types. Closed set.

| Noun | Test | Cite |
|---|---|---|
| `entry` | Exports a handler the platform calls | the export in the file `main` points at |
| `binding` | Declared in the deploy config, reached through `env` | the config block **and** one read site |
| `route` | A surface the entry branches on | the branch line |
| `table` | Survives the Worker's death | `CREATE TABLE` + indexes |
| `config-record` | One file or row per instance, uniform shape | the file + its loader |
| `secret` | Read from `env`, no default in code, no value in the repo | the read site + what fails without it |

**`route` is the exception to the "one card per noun" habit.** A Worker with thirty branches does not get thirty cards — that is thirty photocopies of an `if`. Map the route surface as one card, and give a branch its own card only when it owns behaviour nothing else does.

**Three env shapes, and only one is a `secret`:**

| In code | In deploy config | It is |
|---|---|---|
| `env.X` with no fallback | absent | a **`secret`** — supplied at deploy, fails closed |
| `env.X \|\| 'default'` | absent | an **optional var**. Not a secret, not a ghost. Absence is normal operation — say so in the card and move on |
| `env.X` read | present | a plain var — usually not worth a card |

Getting this wrong is easy: the first and second look identical in a grep. Read the line, not the match.

## What counts as a movement

Something that runs and changes state or decides a branch. Six verbs, closed:

`verify` · `resolve` · `gate` · `render` · `persist` · `schedule`

Two tests before writing a movement card:

1. **Does it actually run?** Trace a real request path to it. A function nobody calls is a `ghost`, not a movement.
2. **Is it its own step, or a line inside another?** Three real movements beat six invented ones.

**`gate` vs `verify`, when something is both.** A `verify` answers *"is this caller who they claim to be"*. A `gate` answers *"is this allowed to proceed"*. When one function does both, file it as `gate` and name the verification inside it — the hard stop is the part a reader must not soften.

**A gate ends the run.** It returns, throws, or short-circuits. A check that logs and continues is not a gate; call it what it is. This is the single most consequential misfiling in a Worker map: a reader who thinks a hard stop is a warning will "clean it up" and find out in production.

## Universes

Every card declares one.

- **`live`** — in force. Implement against it.
- **`leftover`** — still present, no longer the main path.
- **`ghost`** — named, not wired. **Do not implement against it.**
- **`inert`** — declared and reachable, but its value makes it do nothing (an empty retention window, a limit computed and never applied). Not a ghost: the wiring exists. Not live: nothing happens.

### A ghost is never inherited from a comment

Comments rot faster than code. Before marking anything `ghost`, grep for its call sites and **put the command and its output in the card**. A card claiming "nothing writes this" without the grep behind it is how a map starts lying — and it is the exact failure this instrument was tuned against, after a comment claimed a column was never written while two call sites were writing it.

**Deliberate ghosts come in two opposite flavours. Name which one.**

- **Fail-closed by absence** — the code reads a flag that the deploy config never declares, so the path *cannot exist* in production. A ghost that protects. Do not "fix" it by declaring the var.
- **Fail-open to a default** — an optional binding whose absence makes the code take a simpler path (no cache, direct to the database). A ghost that defers. Binding it is a real decision with real costs, not a completion.

Same label, inverted consequence. A reader who confuses them makes production either louder or quieter than intended.

## How to mark Hits and Does not hit

Every card ends with both. First-order only.

- **Hits** — name the file or table, and *why*.
- **Does not hit** — name the **most obvious wrong neighbour** and why it is wrong. This is the harder half and it is what earns the map. The reader's next guess is usually the file sitting next to it in the folder; if that file is untouched, say so, or they will read it for nothing.

**For a `ghost` card, the waterfall is conditional and says so:** not "what this touches" (nothing) but "what changes the day someone wires it."

If you cannot name a Does-not-hit, you have not understood the noun yet. Do not leave it blank.

## Absent vs. undocumented

A blank in a card means "does not apply" and nothing else. If you did not look, or looked and could not tell, write that in the card — `not examined` and `could not determine` are legitimate and useful. An empty field that a reader cannot tell apart from an unexamined one is worse than no card.

## When two rules collide

Two rules in this file can both apply and demand opposite things. When that happens the answer is decided here, not improvised at the card.

**Citation vs. redaction — redaction wins.** The rule is that a card cites `path:line` and quotes verbatim. The rule is also that a secret's value never enters a card. A line that assigns a literal secret satisfies the first and violates the second. **Cite the line, quote nothing from it, and say why:** `` `config.js:41` — assigns the signing key; value withheld ``. The citation still resolves, the reader can still open it, and the map does not become the leak. A quote is evidence; a secret in a map is a liability, and a liability outranks evidence.

That is the only collision resolved so far. When you hit another, decide it, write it here, and say which rule lost.

## What you refuse to put in a card

- **Secret values.** Ever. Role, read site, failure mode — never the value. See the collision rule above for what to do when the line you must cite is the line that holds it.
- **Customer data.** Field shapes yes, rows no.
- **Behaviour.** Do not narrate the function. Point at the file that owns it. A card that restates the code is a photocopy; the reader already has the code.
- **The bug story.** A defect belongs in one line under *Why this shape*, and only when it explains the shape. The moment a card is *about* a failure, you have stopped being a cartographer and started being a diagnostician.

## What is in the repo but not in the territory

A Worker repo usually ships more than the Worker: a frontend bundle, offline scripts, tests, CI. None of it fits the six noun types, and that is correct — the map covers one deploy.

Do not force them into cards, and do not silently drop them. Name them once in the catalog as out of scope, with one line on where they live and why they are out. A reader who finds a 3,000-line client app in the repo and nothing about it in the map assumes the map missed it.

**One exception worth carrying:** if changing a mapped noun breaks something out of scope (a test, a CI job, the client), that belongs in the noun's **Hits**. Scope limits what gets a card, not what a change is allowed to touch.
