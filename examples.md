# examples.md

**This file demonstrates. It does not teach** — the doctrine is in `rules.md` and `reference.md`. If this file grows past them it has started explaining the rules instead of proving them. Full maps live in `proof/`, not here.

One worked territory: a multi-tenant patient-intake Worker, private repo. Citations are real `path:line` into a tree you do not hold — they show the *grain* of a citation, not something to click.

---

## The catalog (excerpt)

| The word | Means here | Also means | Covered |
|---|---|---|---|
| the product name | this Worker: the bot a **patient** uses to book | a vertical in a **different** Worker, separate deploy: what a **prospect clinic** talks to | only this one; the sibling is named, out of scope |
| `DB` | the binding name in code | a D1 database with a different real name (`wrangler.toml:71-74`) | both, stated once |
| "patient" | product word | a row in `leads` (`schema.sql:45`) | the pair, then the code name throughout |

**Nouns:** `entry` (`index.js:60`) · tenant `config-record` · `leads`, `agendas` · D1, KV · five `secret`s
**Movements** (`index.js:10-13`): `verify` → dedup → rate-limit → `resolve` → `gate` → `render` → extract → `persist`
**Out of scope:** none — this repo ships only the Worker.

**Ghost, with its grep:** `PERMITIR_TENANT_EN_BODY`, read at `resolver.js:104`. `grep -n "PERMITIR_TENANT_EN_BODY" wrangler.toml` → no output; the only `[vars]` are four unrelated ones (`wrangler.toml:44-54`). **Fail-closed by absence** — the path cannot exist in the deployed Worker. Do not declare the var.

---

## Card — tenant config record

```
type: object · card: config-record · universe: live · status: verified 2026-08-16 @ 66920d9
```

**One sentence.** One JSON per clinic, holding what differs between clinics; the code holds what does not.

**Why this shape.** The predecessor served one business with its facts baked into the prompt at module load, so a second clinic meant a second Worker. Making the facts a file and the mechanism code is what turned one deploy into N clinics.

**Shape.** Loaded by id, KV first, static import as today's real fallback (`tenant.js:63-90`) — a literal map, not a directory scan (`tenant.js:46-49`), because Workers have no runtime filesystem. Required or the clinic does not serve: `sanitario.via_urgencia`, `sanitario.handoff`, `activo` (`tenant.js:124`, `:146`, `:163`).

**Connected to.**
- **owns:** the per-clinic values in every rendered prompt
- **owned-by:** git — these are versioned; KV is only a cache
- **joins:** `leads.tenant_id`, `agendas.tenant_id`
- **looks-like-but-is-not:** the `[vars]` block of `wrangler.toml`. Both look like configuration. `[vars]` is Worker-level and identical for every clinic; this is per-clinic. A value in the wrong one is either leaked across clinics or missing from all.

**If you change this.**
- **Hits:** `prompt-skeleton.js:35-46` — the only place that knows placeholder names; a renamed key becomes an empty string in a prompt, silently.
- **Does not hit:** `schema.sql`. The assumption is that a new per-clinic field needs a column. It does not — per-clinic variation lives here, per-patient variation in one JSON column (`schema.sql:73`). Zero DDL per client is what makes this multi-tenant; a column added for one clinic breaks it.

**Surfaces.** Humans write it, one file per clinic. The loader reads it every request. No agent writes it.

**See.** `src/tenant.js`

---

## Card — the tenant gate

```
type: process · card: gate · universe: live · status: verified 2026-08-16 @ 66920d9
```

**One sentence.** The decision, before any prompt is built, of whether this clinic runs at all.

**Why this shape.** Three things can be missing and they break differently: no urgency path means someone describing an emergency has nowhere to go; no escalation path violates the platform's messaging policy and the number gets shut down; not active is a clinic correctly configured but paused. One merged check would hide which one bit.

**Shape.** Three sequential early returns, each with its own error code (`tenant.js:124-136`, `:146-158`, `:163-165`). All hard stops — `tenant.js:144-145`. A fourth check is deliberately **not** a gate: a missing shape field logs and continues, because it may be under construction (`tenant.js:171-175`).

**Connected to.**
- **owns:** the yes/no on serving one request
- **owned-by:** the loader — same function, second half
- **joins:** consumes the config record; everything downstream assumes it passed
- **looks-like-but-is-not:** the HMAC verification at `index.js:84`. Both reject requests. That one proves the request came from the platform — an attack surface. This asks whether a *legitimate* request is allowed. A reader hardening security finds HMAC and will not have touched this.

**If you change this.**
- **Hits:** `prompt-skeleton.js:40-41` — those placeholders are filled only because this gate proved them non-empty. Loosen it and templates render blank blocks with nothing failing loudly.
- **Does not hit:** the data layer. It has no gate of its own (`crm.js:60`) and trusts the caller filtered. That trust is why this must stay a hard stop — there is no second line.

**Surfaces.** No human, no agent. Code only, every request, before anything else.

**See.** `src/tenant.js:63-177`

---

## Card — the D1 binding, and why it is here

The quiet case. **Most objects in a Worker have no story.** A cartographer who finds a ghost in every card is inventing them; an honest map is mostly short cards like this, and a clean territory produces a short map. If your first walk turns up drama everywhere, re-read before you write.

```
type: object · card: binding · universe: live · status: verified 2026-08-16 @ 66920d9
```

**One sentence.** The D1 database, bound as `DB` in code, named something else in the deploy config.

**Why this shape.** Its own database rather than a shared one: the sibling Worker stores sales leads, this one stores patient intake — different retention obligations, so they do not share a table even though they could.

**Shape.** `[[d1_databases]]`, `binding = "DB"` — `wrangler.toml:71-74`. Read by every function in the data layer, each filtering on `tenant_id`.

**Connected to.**
- **owns:** nothing itself — the tables own the data
- **owned-by:** the deploy config
- **joins:** `leads`, `agendas`
- **looks-like-but-is-not:** the KV binding four lines above (`wrangler.toml:59-61`). Both are stores reached through `env`; KV holds ephemeral state, D1 holds the record. Neither is a fallback for the other.

**If you change this.**
- **Hits:** every prepared statement in the data layer — they bind against this handle.
- **Does not hit:** the prompt layer, which never sees a row.

**Surfaces.** Code only.

**See.** `wrangler.toml:71-74`
