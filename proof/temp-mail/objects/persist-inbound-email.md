# Card — inbound mail persist

```
type: process · card: persist · universe: live · status: verified 2026-08-16
```

**One sentence.** What the `email` handler writes when Cloudflare Email Routing hands the Worker a message: one `messages` row, up to five `attachments` rows, and one touched `inboxes.last_message_at`.

**Why this shape.** The whole message is stored inline in D1, including the raw RFC822 source (`raw_source`, `schema.sql:74`) and every attachment as base64 text (`content_base64`, `schema.sql:90`). No object store, no R2 binding. That choice is what makes the size ceilings load-bearing rather than cosmetic: raw is truncated to 512 KB before it is ever decoded (`email.js:37` against `security.js:10`), bodies are rejected above 256 KB (`email.js:128`), and attachments are capped at five per message (`email.js:131` against `security.js:13`). Remove a ceiling and a single mail can take a D1 row past what the row can hold.

**Shape.**
- Entry: `handleInboundEmail(message, env, config)` — `email.js:111`, called from `src/worker/index.js:29` with no `waitUntil`
- **Rejection comes before any write** — `email.js:115-120`: `findInbox` throws, the handler calls `message.setReject?.()` at `:118` and rethrows. This is the SMTP-level "no such mailbox", and it is the reason the handler must not swallow errors.
- `findInbox` (`email.js:58-73`) requires the recipient domain to be in `MAIL_DOMAINS` (`:61`, 550 `recipient_domain_not_configured`) and the joined inbox+domain to be active and not deleted (`:69`, 550 `inbox_unavailable`)
- Body size assertion — `email.js:128`, on text and HTML concatenated
- The `messages` INSERT — `email.js:133-149`, twelve columns; `has_attachments` is derived, not passed (`:148`)
- `storeAttachments` — `email.js:75-109`. Each attachment gets a SHA-256 of its base64 (`:78`), and the INSERT is **tried twice**: once with `content_id`, and on a "no such column: content_id" error (`:54-56`, `:94`) again without it (`:95-106`). That fallback is the runtime shim for a database that has not run `migrations/0005_add_attachment_content_id.sql:1`. The identical shim exists on the read side at `inboxes.js:100-122`.
- The touch — `email.js:151`, `UPDATE inboxes SET last_message_at`
- No transaction. Five statements, run in sequence, each independently.

**Connected to.**
- **owns:** everything a stored message is
- **owned-by:** the `email` handler at `src/worker/index.js:27-30`; upstream, an Email Routing rule outside this repo (`README.md:88-89`)
- **joins:** writes `messages.inbox_id` (`schema.sql:66`) and `attachments.message_id` (`schema.sql:85`); reads `inboxes` + `domains` through the join at `email.js:64-68`
- **looks-like-but-is-not:** `createInbox` (`inboxes.js:308-348`). Both are the "write path" and both insert. `createInbox` is an HTTP route: it rate-limits (`inboxes.js:313`), it checks an actor (`:311`), it returns a response. This runs on the `email` trigger with no request, no actor, no CORS, no rate limit, and returns a plain object nobody reads (`email.js:152`). A rate limit added to "the write path" in `security.js` will not touch inbound mail at all.

**If you change this.**
- **Hits:** `src/server/mime.js` — every field written here except the id and the recipient comes out of `parseMimeMessage` / `parseHeaders` (`email.js:124-131`); the parser's output keys (`textBody`, `htmlBody`, `from.name`, `from.address`, `subject`, `attachments[].contentBase64`, `.contentId`) are the INSERT's arguments. And `src/server/inboxes.js:124-141`, the read-side projection that decides which of these columns a client ever sees. And `src/server/jobs.js:17-18`, which deletes attachments before messages — inverting that order under the FK at `schema.sql:95` is how orphans appear.
- **Does not hit:** `src/server/router.js`. It is the first file a reader opens to ask "where does mail come in", and mail never passes through it. `router.js` is reachable only from `src/worker/index.js:9`, which fires on `url.pathname.startsWith('/api/')` — the `email` handler at `:27` bypasses it entirely. There is no HTTP route that ingests a message, so no amount of route-level auth, CORS or rate limiting applies to inbound mail; the only gates it has are the two 550s inside `email.js:58-73`.

**Surfaces.** Written by the platform, on every inbound message. Read by the dashboard and by API keys, through `inboxes.js`. Swept by the daily cron. No human writes here.

**See.** `src/server/email.js:111-153`
