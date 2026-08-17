# 07 — Friction report on the instrument

Where `worker-cartographer` failed, was ambiguous, or contradicted itself while mapping `temp-mail`. Ordered by cost.

---

## 1. Two rules classify the same line as two different things, and both are wrong

`rules.md:16` defines a `secret` as: *"Named in code, absent from the repo — `env.SOMETHING` with no `[vars]` entry."*
`rules.md:41` defines a ghost as, among others: *"an `env.FLAG` read by code and never declared."*

These are the same test. In this Worker, three reads satisfy both:

- `env.ADMIN_BOOTSTRAP_HASH_STRATEGY` — `config.js:79`, absent from `wrangler.toml`
- `env.RATE_LIMIT_MESSAGE_READ_PER_MINUTE` — `inboxes.js:367`, absent from `wrangler.toml`
- `env.MESSAGE_RETENTION_DAYS` — declared, so not affected, but the pattern is identical

Neither is a secret and neither is a ghost. Both are ordinary optional vars with a code-side default (`|| 60` at `inboxes.js:367`; `|| 'pbkdf2-sha256'` at `config.js:79`), so the undeclared state is *normal operation*, not fail-closed absence. The instrument has no way to say "optional var with a default", which is the single most common env pattern in this codebase — and its two available labels are both misleading. I invented no seventh type; I filed them in the catalog's ghost section with the default spelled out, which is the least-wrong option the closed set allows.

**Fix suggestion:** the `secret` test needs a second clause — *and the code does not supply a default*.

## 2. The `binding` citation requirement is impossible for the exact case the instrument cares about

`reference.md:12` requires a `binding` card to cite *"the `wrangler.toml` block + one read site."*
`MAIL_KV` has no read site. That is the entire content of the card. The required citation format cannot be satisfied by the finding the instrument is proudest of (`README.md:45` of the instrument, on ghost discipline). I substituted a negative citation — the grep and its empty result — plus a contrast grep against `ASSETS` to show what a live binding looks like in the same tree. That worked, but I made it up; nothing in the instrument sanctions it.

## 3. Nothing in the instrument produces the "open questions" it repeatedly points at

`reference.md:5`: *"if something does not fit, that is information about the territory... Write it in the map's open questions and move on."*
The audit order (`README.md:36-41`) has six steps — Inventory, Catalog, Nouns, Movements, Change impact, Re-verify. **None of them is "open questions", and no file in the instrument defines where that section lives.** This file exists because I created it. A cold model following the audit order literally would drop every non-fitting observation on the floor.

## 4. The card header is mandatory and undocumented

`reference.md:29-40` lists the seven required sections. `rules.md:33` says *"every card declares one"* universe. `reference.md:65` says *"`status: verified` requires a date and a citation."*

Universe and status are not among the seven sections. They live in a fenced header line that appears only in `examples.md:46`, `:78`, `:110` and is specified nowhere:

```
type: object · card: config-record · universe: live · status: verified 2026-08-16
```

Worse, `type:` takes values `object` and `process` (`examples.md:46` vs `:110`) — a **thirteenth and fourteenth classification** that no file defines, sitting on top of the "closed set of twelve". I copied the format from the example, which `README.md:22` explicitly warns against doing (*"If your first card looks like its first card, you copied instead of mapping"*). I had no alternative: it is the only place the required metadata is shown.

## 5. `route` fails the instrument's own definition of a noun

`rules.md:5`: *"A thing with a name that survives a request. If it exists only inside one invocation, it is not a noun."*
`rules.md:13` then lists `route` as a noun, tested by *"a pathname the entry branches on."* A pathname is a string literal in a source file. It does not survive a request; it does not exist *during* one except as a comparison. In this Worker that made the `route` noun nearly useless: there are ~28 branches in `router.js:30-202`, they are all the same kind of thing, and one card per pathname would be 28 photocopies of an `if`. I collapsed them into a single stub entry — "the `/api/*` route surface" — which the instrument neither authorises nor forbids.

## 6. Step 5 of the audit order duplicates the catalog, and `reference.md` says not to

`README.md:40` makes "Change impact — which cards to open before a given change" its own audit step.
`reference.md:49` says the **catalog** does that pointing, *"and it never repeats the waterfalls, because two copies of a waterfall drift."*
So the fifth step produces something the second step already produced. I wrote both (`01-catalog.md` §Change impact and `05-change-impact.md`) and kept the second to scenarios and traps rather than waterfalls, but this is exactly the drift `reference.md:49` warns about, caused by the instrument's own step list.

## 7. An instruction that cannot be followed by the agent the instrument is written for

`README.md:34`: *"Stop after each step and let a person read the output before the next one starts."*
`README.md:16`: *"Stop after the catalog and show me."*
`identity.md:30` states the intended reader is *"a cold model... It cannot ask you a question."*

A subagent handed the whole job in one non-interactive turn cannot stop and show anyone. I ran all six steps and wrote them as separate numbered files so a human can still read them in order. This is a real conflict between the instrument's operating model (interactive, human in the loop) and the way it is actually deployed.

## 8. What in this Worker did not fit the closed set at all

**The SPA.** `src/frontend/` is 3,832 lines (App.vue 1812 + styles.css 2020) inside the same deploy, served through the `ASSETS` binding (`src/worker/index.js:20-21`). It is not an `entry`, `binding`, `route`, `table`, `config-record` or `secret`. `identity.md:15-20` defines walkable territory as *"a `wrangler.toml` ... a `src/` with an entry ... optionally a D1 schema"* — it does not contemplate a Worker that ships a client. I mapped the binding and declared the SPA out of scope in `objects/binding-assets.md`. A reader asking "where does the dashboard decide to hide the inbox list from an admin under privacy lock" gets no answer from this map; the answer is `App.vue:810` and `App.vue:1588`, and nothing in the closed set can hold that.

**`config-record` went entirely unused.** No per-instance file, no per-tenant row. The nearest thing, `app_settings`, is one row per *key*, not per instance, so I carded it as a `table`. `reference.md:5` covers the reverse case (something that fits nothing) but says nothing about a type that matches nothing — is an unused type worth stating? I stated it in the catalog on the theory that a reader looking for multi-tenancy should learn in one line that there is none.

**Two sources of truth for tables.** `reference.md:14` says cite *"`CREATE TABLE` in a schema or migration"*. Here **both** exist and they differ: `schema.sql:92` has `content_id` inline; `migrations/0001_permanent_inbox_schema.sql:89` does not, and `migrations/0005_add_attachment_content_id.sql:1` adds it later. The code carries a runtime shim for databases where the column is missing (`email.js:93-107`, `inboxes.js:112-121`). The instrument's "or" leaves the cartographer to pick, and picking wrong makes the card describe a database some deploys do not have. I cited `schema.sql` as primary and named the migration divergence explicitly in `persist-inbound-email`.

**`gate` vs `verify` had no tie-break.** `requireInboxAccess` (`inboxes.js:241-266`) both proves the caller is legitimate (`verify`, per `reference.md:22`) and ends the request (`gate`, per `reference.md:24`). `rules.md:29-30` says prefer fewer, real movements, which pushed me to one card — but `rules.md:31` says `gate` is *"the one most often mislabeled"*, which pushes toward splitting so the hard stop is unmistakable. I chose `gate` because the stop is the load-bearing property. The instrument gave me no rule for that call.

---

## What worked, briefly, because it is load-bearing

The ghost discipline (`rules.md:39`) is the reason this map is worth anything. `README.md:44` of the *territory* declares `MAIL_KV` a deliberate placeholder — trusting that sentence would have been the whole card. Grepping instead surfaced five more ghosts the docs never mention, including `config.rateLimits.messageReadPerMinute` (`config.js:103`), where a validated 1–3000 bound is computed and then bypassed by all six of its would-be consumers. No comment anywhere says so.

The *Does not hit* requirement (`rules.md:48-50`) was the hardest half and produced the map's best content — the CORS/access-gate confusion, `security.js` not being where KV would go, `auth.js` having no notion of access mode. Every one of those took a second read to be sure of, which is the point.
