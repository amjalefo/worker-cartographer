# Card — `ASSETS`

```
type: object · card: binding · universe: live · status: stub
```

**One sentence.** The static-assets binding that serves the built Vue SPA for every path that is not `/api/*` (`wrangler.toml:6-9`, read at `src/worker/index.js:20-21`).

Remaining six sections: **stub.** Anchors: `directory = "dist"` (`wrangler.toml:7`) is produced by `vite build` (`package.json:9`, `vite.config.js`), so the binding is empty unless `npm run build` ran first — which is why `deploy` chains them (`package.json:16`). `not_found_handling = "single-page-application"` (`wrangler.toml:9`) means an unknown path returns the app shell with 200, not a 404. The guard `if (env.ASSETS)` (`src/worker/index.js:20`) has a plain-text fallback at `:24`.

**Note for the reader:** the SPA this binding serves (`src/frontend/App.vue`, 1812 lines, plus 2020 lines of CSS) is *not* mapped by this instrument — see `07-friction.md`. It is in the same deploy and it is not any of the six noun types.

**See.** `wrangler.toml:6-9`
