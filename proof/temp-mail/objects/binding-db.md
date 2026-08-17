# Card — `DB`

```
type: object · card: binding · universe: live · status: stub
```

**One sentence.** The D1 binding named `DB` in code and `rdhx-email-db` in the account (`wrangler.toml:14-17`); every persistent noun in this Worker is a table inside it.

Remaining six sections: **stub.** Anchors for whoever fills it: the declaration at `wrangler.toml:14-17`; seven independent `requireDb` guards, one per module, each throwing 500 `database_not_configured` (`auth.js:103-106`, `inboxes.js:9-12`, `email.js:8-11`, `jobs.js:3-6`, `settings.js:5-8`, `api-keys.js:9-12`, `api-key-requests.js:7-10`); an eighth inline guard inside the rate limiter (`security.js:67`); `database_id` is a placeholder that must be replaced before deploy (`wrangler.toml:17`).

**See.** `wrangler.toml:14-17`
