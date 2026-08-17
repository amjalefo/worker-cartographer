# Card — the three secrets

```
type: object · card: secret · universe: live (two of the three are gate-only) · status: verified 2026-08-16
```

**One sentence.** `SESSION_SECRET`, `JWT_SECRET` and `ADMIN_BOOTSTRAP_SECRET` — three names read from `env`, absent from the repo, and only one of them has a consumer.

No value of any of them appears in this card, in the map, or in the repo. `.gitignore` keeps `.dev.vars` out (`README.md:71`, `README.md:80`).

**Why this shape.** All three go through one function, `requireSecretPlaceholder` (`config.js:13-19`), which throws unless the value is at least 32 characters. That throw happens inside `loadConfig`, which runs at `router.js:206` — **before any route is matched and before any auth runs**. So the length check is the Worker's first gate, and its failure mode is total: with a missing or short secret every `/api/*` request returns 500 `config_error` from `src/worker/index.js:13`, including `/api/health`. Two of the three are load-bearing *only* through that throw.

**Shape.**
- `SESSION_SECRET` — read at `config.js:95`. The resulting `config.sessionSecret` has no other reader: `grep -rn "sessionSecret" .` returns that single line. Sessions do not use it — the token is 36 random bytes (`auth.js:142`) and the stored hash is a plain unkeyed SHA-256 (`auth.js:144`, `auth.js:67-70`). Its only function is to exist.
- `JWT_SECRET` — read at `config.js:96`. Same: `grep -rn "jwtSecret" .` returns only that line, and `grep -rn "JWT" src/` finds no signing, no verifying, no JWT anywhere. There are no JWTs in this Worker; there is a required name.
- `ADMIN_BOOTSTRAP_SECRET` — read at `config.js:84`, inside `readAdminBootstrap`. **This one is consumed**: `auth.js:184` compares it against the `x-admin-bootstrap-secret` request header and throws 403 `bootstrap_forbidden` on mismatch. It is the only thing standing in front of first-admin creation at `POST /api/auth/bootstrap-admin` (`router.js:80-83`).
- The header name is also allowed through CORS explicitly — `cors.js:19`.
- Declared as required in `README.md:90-93`; installed with `wrangler secret put` per `README.md:212-214`.

**What fails without each.** All three fail identically and immediately: `Error: <NAME> must be configured as a Worker secret with at least 32 characters` (`config.js:16`) → 500 on every API path. There is no degraded mode and no per-route fallback. A 31-character secret fails the same way a missing one does.

**Companion ghost.** `ADMIN_BOOTSTRAP_HASH_STRATEGY` (`config.js:79`) validates into `config.adminBootstrap.hashStrategy` (`config.js:85`) and is never read again — `grep -rn "hashStrategy" .` returns that one line. Its second accepted value, `argon2id-external` (`config.js:4`), has no implementation anywhere: `grep -rn "argon2" .` hits only `config.js:4` and `config.js:81`. Setting it does nothing; PBKDF2 (`auth.js:72-83`) is the only hasher.

**Connected to.**
- **owns:** the deploy's ability to serve any API request at all
- **owned-by:** Cloudflare Worker secrets, per `README.md:82`; locally `.dev.vars` (`README.md:103-108`)
- **joins:** `config.js:89-106` builds them into the config object every request; `auth.js:184` is the single consumer
- **looks-like-but-is-not:** the `[vars]` block at `wrangler.toml:23-34`. Both arrive as properties of `env` and both are read by `config.js`, which makes them look interchangeable. `[vars]` is committed, public, and visible in the dashboard; secrets are none of those. Moving `ADMIN_BOOTSTRAP_SECRET` into `[vars]` to "fix a config error" would publish the only credential that guards admin creation, and nothing in the code would complain — `requireSecretPlaceholder` checks length, not origin.

**If you change this.**
- **Hits:** `src/worker/index.js:12-17` — it is the only `catch` that turns a `loadConfig` throw into a response, and it puts `error.message` into the body, so a renamed secret surfaces its new name to any unauthenticated caller. And `tests/config-router.test.js:16-17`, which supplies both secrets to every test env; a fourth required secret makes the whole suite throw at construction.
- **Does not hit:** `src/server/auth.js`'s session machinery. It is the obvious neighbour — the file is called auth, the secret is called `SESSION_SECRET` — and rotating that secret invalidates nothing. Sessions are rows in `sessions` keyed by an unkeyed digest (`auth.js:144-150`); no secret participates. If the goal is to log everyone out, the lever is the `sessions` table (`auth.js:210` revokes one, `auth.js:257` revokes a user's), not a secret rotation.

**Surfaces.** Humans write them, once, through `wrangler secret put`. Code reads all three every API request and consumes exactly one. No agent, no UI.

**See.** `src/server/config.js:13-19` and `:78-97`
