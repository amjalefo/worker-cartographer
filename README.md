# worker-cartographer

> ⏸ **Parked until Thu 20 / Fri 21 Aug 2026** — see [NEXT.md](NEXT.md) for where to resume and what is still open.

Drop this folder into a Claude project, point it at a Cloudflare Worker, and it maps it. What it leaves behind — a catalog plus cards — is the product. This folder is the instrument.

## Judge protocol — six minutes, no API key

1. `node verify.mjs --selftest` — ten deliberately broken maps, each must fail on its **own** named check; failing on the wrong one counts as a miss. It also prints coverage: every check that can fail a real map has a fixture proving it still fires, or is listed with the reason it does not.
2. `node verify.mjs proof/relay --subject <a clone of YuriCrystal/relay>` — the two maps in `proof/` were produced by cold agents against public repos they had never seen. With `--subject`, every `path:line` is re-read from the actual file. Without it, citations report as unverifiable rather than passing.
3. `proof/relay/07-friction.md` and `proof/temp-mail/07-friction.md` — what each agent said this instrument got **wrong**. Read those before believing anything above.

Expect failures in step 2, and they are the point: both maps still carry `verified <date>` without a commit, because the rule requiring a commit came *from* these friction reports and postdates the walks. `KNOWN-ISSUES.md` has the chain.

The checker refuses to flag what it cannot quote. If a claim cannot be pinned to a line, it reports the gap rather than a verdict.

## What to feed it

One Cloudflare Worker: a deploy config and the source `main` points at. One deploy, however large. Two Workers sharing a product name but not a deploy are two territories, and it will say so instead of blending them.

It does not walk a Rails app or a folder of notes. Pointed at one, the right answer is to stop, not to improvise a seventh noun type.

## How to start it, cold

```
Load identity.md and rules.md, then reference.md.
Walk <path to my Worker> following the audit order in README.md.
Stop after the catalog and show me.
```

**Load list.**

- **Always, first:** `identity.md`, `rules.md` — who you are, how you decide.
- **At step 2:** `reference.md`. The catalog needs the closed card set and the collision taxonomy, both of which live there. Do not defer it to card-writing time; the catalog cannot be built without it.
- **Shape reference only:** `examples.md`. It holds a worked territory that is **not yours**. Read it for the grain of a citation and how a collision gets written. Do not carry its nouns or conclusions into your map. If your first card looks like its first card, you copied instead of mapping.

### Load versus verify — the cartographer never reads its own test material

Four files are the **product**: `identity.md`, `rules.md`, `reference.md`, `examples.md`. Those get loaded.

`verify.mjs`, `proof/` and `KNOWN-ISSUES.md` are **evidence about the product**. They are for a judge, a skeptic, or you deciding whether to trust this. **The cartographer never loads them** — a walk that reads `proof/` has seen two finished maps before writing its first card, and will produce a third one shaped like them instead of like the territory.

This is why the answer key is not in the drop-in: `proof/` sits beside the instrument, never inside the load list.

## The audit order

Six steps. Stop after each and let a person read the output before the next.

1. **Inventory** — list the tree, classify `live` / `leftover` / `ghost` / `inert`. No cards yet.
2. **Catalog** — nouns, movements, the three-source collisions, what is in the repo but out of scope. Stub lines for everything you will not fill.
3. **Nouns** — one card per type, seven sections each.
4. **Movements** — only what actually runs.
5. **Change impact** — which cards to open before a given change. It **names** cards; it never repeats their waterfalls.
6. **Re-verify, and `open-questions.md`** — rip the Hits / Does-not-hit again, then write down everything that fit no card type. A wrong waterfall costs more than a missing card.

**Running without a human in the loop** (a delegated agent, one pass): the stops are not available to you. Run all six, number the outputs so a person can still read them in sequence, and say in `open-questions.md` that no checkpoint was taken. Do not pretend the gate happened.

## How the finished map gets read

**Catalog. Then one card. Then stop.** Never the whole objects folder — the catalog exists so nobody has to. Full reader protocol in `reference.md`.

## What it refuses

It will not print a secret's value, copy customer rows, narrate a function line by line, or turn a card into the story of a bug. It will not mark something a ghost because a comment said so — it greps for call sites and puts the command and its output in the card. Comments rot faster than code, and this instrument was tuned after one claimed a column was never written while two call sites were writing it.

## About the example and the proof

`examples.md` maps a private repo — real `path:line` into a tree that is not published, stated rather than hidden. It is there to show the shape of a card.

`proof/` is the opposite: two **public** Workers, mapped cold by agents with no memory of this build, so the citations resolve for anyone. That is where to check whether the instrument works, not in the example.

---

Built on Interpretable Context Methodology (Van Clief & McDermott, arXiv:2603.16021). The generic method — audit slices, seven card sections, walk test — comes from the ICM Architect skill's System map form. What is added here: the closed noun and movement set of a Cloudflare Worker, the three env shapes that a grep cannot tell apart, the two opposite flavours of deliberate ghost, and a checker that fails on its own examples.
