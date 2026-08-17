# Card — the inbox access gate

```
type: process · card: gate · universe: live · status: verified 2026-08-16
```

**One sentence.** The single decision, taken before any message body is selected, of whether this caller may see this inbox — `requireInboxAccess` in code, "can you open that mailbox" in product terms.

**Why this shape.** Every branch is a `throw`; none logs and continues. The reason is visible in the return codes: the gate answers "no" as **404 `inbox_not_found`** in three separate places (`inboxes.js:254`, `:257`, `:287`) where the honest answer is "yes it exists, not for you". Turning any of those into a 403 — or into a warning — tells an unauthenticated caller which addresses exist, which is the whole attack against a temp-mail service. The 404s are the feature.

**Shape.**
- `requireInboxAccess(request, db, inboxId, config)` — `inboxes.js:241-266`. Its address-keyed twin is `requireInboxAddressAccess` — `inboxes.js:268-288`. **Two functions, not one**, and they do not agree; see below.
- Row lookup first, and a hard 404 if the inbox is absent, disabled or soft-deleted — `inboxes.js:244-249`
- Privacy-lock stop — `inboxes.js:250`, implemented at `:223-227`: if `config.privacyLock` and the actor's role is `admin`, throw 403. It blocks **only** admins; every other actor passes.
- Owner-scoped branch — `inboxes.js:251-255`: an inbox with an `owner_user_id` requires an actor, and requires it to be *that* actor.
- Anonymous-inbox branches, in order — `inboxes.js:256-259` (a signed-in dashboard user passes; an API key is refused with a 404), `:260` (public mode: anyone passes), `:261-263` (private mode: 401), `:264` (inbox-token match), `:265` (403 otherwise)
- The token is accepted from a header **or** a query string — `inboxes.js:243` — and compared as a hex digest against `access_token_hash` (`inboxes.js:236-239`)
- Reached from six routes through `getMessageWithAccess` (`inboxes.js:391-396`) and directly from `listMessages` (`inboxes.js:370`)

**Not a gate, and one line away.** `requireInboxAddressAccess` (`inboxes.js:268-288`) has **no inbox-token branch at all** — it ends at an unconditional `throw` (`inboxes.js:287`). Reaching an inbox by address is strictly less permissive than reaching it by id. Anyone who "unifies" the two functions will either open the address path to tokens or close the id path against them.

**Connected to.**
- **owns:** the yes/no on reading one inbox and everything under it
- **owned-by:** `src/server/inboxes.js` — the gate is a private function in the same module as its callers, not a separate middleware
- **joins:** consumes the actor produced by `optionalActor` (`inboxes.js:210-215`), which resolves a bearer token to either a session user (`inboxes.js:197-203`) or an API key (`inboxes.js:205`); consumes `config.accessMode`, which by then came from `app_settings` (`config.js:113`)
- **looks-like-but-is-not:** `requireUser` / `requireRole` in `auth.js:161-178`. Both reject requests with 401/403 and both are called "auth". `requireRole` guards the **admin surface** — it is what stands in front of `/api/admin/*` at `router.js:110`, `:117`, `:124` and elsewhere, and it never looks at an inbox. This gate guards **data ownership** and runs on routes that have no role requirement at all. A reader tightening admin permissions will find `auth.js` and will not have touched inbox access; a reader tightening inbox access must not go looking in `auth.js`.

**If you change this.**
- **Hits:** the six read/write routes that sit behind it, because each assumes the gate already ran and none re-checks — `listMessages` (`inboxes.js:366`), `viewMessage` (`:398`), `viewMessageHtml` (`:408`), `viewMessageSource` (`:433`), `deleteMessage` (`:420`), `viewAttachment` (`:446`). Two of them add a *second* condition on top and would be left dangling by a loosened gate: `deleteMessage` re-demands owner-or-token at `inboxes.js:425-427`, and `viewMessageSource` refuses API keys outright at `inboxes.js:438-440`. Also `tests/config-router.test.js:696`, which asserts an inbox-token holder still reads messages while privacy lock is on.
- **Does not hit:** `src/server/cors.js`. It is the file that *looks* like the access boundary — it is literally organised around `'public'`, `'private'` and `'admin'` (`cors.js:9-13`), the same three words this gate deals in — and it decides nothing about access. `corsHeaders` only chooses which `Origin` gets an allow header (`cors.js:14-15`), and `routeBoundary` (`router.js:10-15`) picks that bucket from the path prefix alone. A request from a disallowed origin still executes and still returns data; it just returns it without CORS headers. Hardening `cors.js` does not restrict a single inbox.

**Surfaces.** Code only, on every inbox and message read. No human, no agent. The tokens it checks are surfaced once to the API caller at creation (`inboxes.js:160`) and held by the browser in `localStorage` under `rdhx-email-inboxes` (`App.vue:5`).

**See.** `src/server/inboxes.js:223-288`
