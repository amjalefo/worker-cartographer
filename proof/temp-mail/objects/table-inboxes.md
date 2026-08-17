# Card — `inboxes`

```
type: object · card: table · universe: live · status: verified 2026-08-16
```

**One sentence.** One row per address — the UI calls it a temporary email, the table is `inboxes`, and nothing about the row is temporary.

**Why this shape.** The name says throwaway and the schema says permanent: there is no TTL column, no expiry, no cron that touches this table. Only `messages` and `attachments` are swept (`jobs.js:17-18`). The migration that created it is literally called `0001_permanent_inbox_schema.sql`. That is the load-bearing decision — an address, once handed out, keeps belonging to whoever holds it, so a later request for the same local part must be adjudicated rather than freshly created (`inboxes.js:333-338`), and the address is unique for the lifetime of the database.

**Shape.**
- `address TEXT NOT NULL UNIQUE COLLATE NOCASE` — `schema.sql:49`. Case-insensitive uniqueness at the storage layer, on top of the code lowercasing everything first (`security.js:32`).
- `UNIQUE (domain_id, local_part)` — `schema.sql:61`. A second, redundant-looking identity. It is the one that survives if a domain is ever renamed.
- `owner_user_id TEXT` — nullable, `schema.sql:48`, `ON DELETE SET NULL` (`schema.sql:60`). **Null is a meaningful state**: it means an anonymous inbox, and the access gate branches on exactly this (`inboxes.js:251`).
- `access_token_hash` / `access_token_prefix` — `schema.sql:51-52`. Written once at creation (`inboxes.js:340`, `:345`) from a hex digest; the plaintext token is returned to the caller once (`inboxes.js:347` via `:160`) and never stored.
- `status` is a three-value check (`active`/`disabled`/`deleted`, `schema.sql:53`) **and** there is a separate `deleted_at` (`schema.sql:57`). Both are queried, together, in the access paths (`inboxes.js:247`, `:274`).
- `last_message_at` — `schema.sql:58`, written only by the email handler (`email.js:151`)
- Indexes: `schema.sql:176-178` — by address+status, by owner+status, by domain+local part
- `FOREIGN KEY (domain_id) ... ON DELETE RESTRICT` — `schema.sql:59`. A domain with inboxes cannot be deleted.

**Connected to.**
- **owns:** the identity of an address, and who may read what arrives at it
- **owned-by:** the `DB` binding (`wrangler.toml:14-17`)
- **joins:** `messages.inbox_id` → `id`, `ON DELETE CASCADE` (`schema.sql:80`); `domains.id` → `domain_id` (`schema.sql:59`); `users.id` → `owner_user_id` (`schema.sql:60`)
- **looks-like-but-is-not:** the `domains` table (`schema.sql:3-11`). `MAIL_DOMAINS` in `wrangler.toml:26` and a row in `domains` look like the same fact stated twice, and they are not: an inbox can be created only if the domain is in **both** — the var is checked at `inboxes.js:187`, the row at `inboxes.js:190` with `status='active' AND is_verified=1`. Adding a domain to `[vars]` alone yields `domain_not_found` (`inboxes.js:191`); inserting the row alone yields `unsupported_domain` (`inboxes.js:188`). Two stores, one AND.

**If you change this.**
- **Hits:** `src/server/inboxes.js` in three specific places, all of which read raw column names off the row — `publicInbox` at `:55-66` (renames `local_part`→`localPart`, `last_message_at`→`lastMessageAt` for the API), `requireInboxAccess` at `:241-266` (branches on `owner_user_id`, `status`, `deleted_at`, `access_token_hash`), and `createInbox` at `:342-345` (the seven-column INSERT). And `src/server/email.js:64-72`, which resolves an inbound recipient by `local_part` + joined `domains.domain` and rejects on `status`/`deleted_at`/`domain_status` — a column rename here rejects mail at SMTP time, not at read time.
- **Does not hit:** `src/server/jobs.js`. It is the file a reader opens after "temporary email" — the retention sweep — and it never mentions this table. `cleanupExpiredMessages` selects from `messages` (`jobs.js:11-14`) and deletes from `attachments` and `messages` (`jobs.js:17-18`). Adding an expiry column here does not make the cron delete inboxes; that code does not exist and would have to be written.

**Surfaces.** Created by the API on request (`inboxes.js:308`), including anonymously when `accessMode` is public (`inboxes.js:232`). Read by the email handler on every inbound message and by every dashboard view. Written by no human directly; the README seeds `domains` by hand (`README.md:165`) but never `inboxes`.

**See.** `schema.sql:45-62`
