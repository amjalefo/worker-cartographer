# Card — the retention sweep

```
type: process · card: schedule · universe: live · status: verified 2026-08-16
```

**One sentence.** The one cron in this Worker: at midnight UTC it hard-deletes messages older than `MESSAGE_RETENTION_DAYS` and their attachments.

**Why this shape.** Everywhere else in this codebase deletion is soft — `deleteMessage` sets `deleted_at` (`inboxes.js:428-429`), users and inboxes have `deleted_at` columns (`schema.sql:26`, `schema.sql:57`). This job is the only place that issues a real `DELETE` (`jobs.js:17-18`). That is the retention promise being kept: a soft-deleted row still holds the mail body, so a service that tells users mail is temporary needs exactly one path where bytes actually leave, and this is it.

**Shape.**
- Trigger: `crons = ["0 0 * * *"]` — `wrangler.toml:11-12`. One entry, daily at 00:00 UTC. The Worker's `compatibility_date` is `wrangler.toml:3`.
- Handler: `scheduled(_event, env, ctx)` — `src/worker/index.js:32-35`. It builds config at `:33` and hands the work to `ctx.waitUntil` at `:34`, so the cron invocation returns immediately and the sweep runs on the extension.
- The event object is discarded (`_event`) — the job does not branch on which cron fired, so a second cron expression would run the same sweep twice.
- `cleanupExpiredMessages(env, config)` — `jobs.js:8-21`
- The window: `datetime('now', ?)` bound to `-${days} days` (`jobs.js:11-14`), where `days` comes from `config.messageRetentionDays` with a defensive `|| 1` (`jobs.js:10`) on top of the 1–30 validation already done at `config.js:94`
- Order of deletion: attachments first (`jobs.js:17`), then the message (`jobs.js:18`) — required by the FK at `schema.sql:95`
- **Row-by-row, in a loop, one round trip per statement** — `jobs.js:16-19`. Not a set-based delete, not batched.
- The selection ignores `deleted_at` entirely (`jobs.js:12-13`): age is the only criterion, so already soft-deleted rows are collected by the same pass.
- Returns a count (`jobs.js:20`) that nothing reads — `ctx.waitUntil` discards it.
- Index supporting the scan: `idx_messages_cleanup ON messages(received_at, deleted_at)` — `schema.sql:180`

**Connected to.**
- **owns:** the actual lifetime of stored mail
- **owned-by:** `wrangler.toml:11-12` — delete the trigger block and the handler at `src/worker/index.js:32` is never called by anything
- **joins:** `messages.received_at` (`schema.sql:78`), `attachments.message_id` (`schema.sql:85`)
- **looks-like-but-is-not:** `deleteMessage` (`inboxes.js:420-431`). Same verb, opposite semantics. That one is user-initiated, gated (`inboxes.js:423-427`), and only stamps `deleted_at`; the row and its bytes stay. This one is unattended, ungated, and destroys. A reader who "fixes" the inconsistency by making the cron soft-delete has quietly turned off retention while every test and every UI still shows messages disappearing.

**If you change this.**
- **Hits:** `src/server/config.js:94` — the 1–30 bound on `MESSAGE_RETENTION_DAYS` is the only validation this job's window ever gets, and it throws at boot for the whole Worker, not at cron time. And `src/server/inboxes.js:455`, which decodes `content_base64` on download: once the sweep has run, that read is an unavoidable 404 (`inboxes.js:454`), which is the intended outcome and not a bug to route around. And `wrangler.toml:28`, the var itself.
- **Does not hit:** the `inboxes` table. It is the obvious neighbour — the product is "temporary email", so a reader expects the sweep to reap addresses — and `jobs.js` never names it. Inboxes are permanent (the creating migration is `migrations/0001_permanent_inbox_schema.sql`); the sweep leaves an empty inbox and its `last_message_at` (`schema.sql:58`) pointing at mail that no longer exists. Nothing reconciles that field, and nothing should be added here expecting it to.

**Surfaces.** No human, no agent, no HTTP surface. Cloudflare invokes it; its result is discarded. Its effect is visible only as messages disappearing from the dashboard.

**See.** `src/server/jobs.js:8-21`
