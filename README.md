# Bounce

A static browser recreation of the colour Nokia Bounce: all 11 original levels, original pixel artwork and tone sequences, and a deterministic 25 Hz simulation based on the community decompilation.

## Play locally

Use Node 22.12 or newer (the project includes `.nvmrc`).

```sh
npm ci
npm run dev
```

Open the URL Vite prints. The development server is also available on your local network for testing a phone. The game needs HTTP(S), rather than opening `index.html` through `file://`.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | Left/right arrows, A/D, or 4/6 | Hold left/right |
| Jump repeatedly | Hold Space, Up, W, or 2 | Hold Jump |
| Pause/resume | Escape or P | Pause/Resume |

Collect all hoops to open the exit. Avoid spikes and moving jacks. Crystals set checkpoints; crystal balls add a life. Inflation lets the ball float, while the small ball sinks and fits narrow passages. Rubber surfaces build stronger jumps, and temporary pickups modify speed, jump height or gravity.

The game pauses when interrupted. A versioned local save stores the level, ball, collected objects, checkpoints, moving hazards, timers and score. Progress stays in that browser; it does not sync. Unavailable audio or storage never prevents play. Restart level restores the level-entry score and lives, preventing repeated checkpoint/pickup farming.

## Build and verify

```sh
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

`dist/` contains the deployable site. It needs no application server, API keys, database or account service. All runtime assets are bundled. `npm run preview` previews the production build.

Unit tests cover original map headers, parsing, physics, water, checkpoints, rings, boosts, input aggregation, corrupt saves and OTT audio. An input-only level-1 replay completes with all six hoops at multiple display refresh rates. Browser tests cover the production build, keyboard/pointer input, pause and save/resume, denied storage, mobile dimensions and subpath hosting. A Chromium test exercises simultaneous multi-touch.

## GitHub Pages

The compiled game is committed in `/docs` for branch-based publishing. No repository workflow is needed.

1. In **Settings → Pages → Build and deployment**, choose **Deploy from a branch**.
2. Select **main** and **/docs**, then **Save**.
3. Open the URL reported by GitHub, usually `https://<owner>.github.io/bounceGame/`.

After changing the game, run `npm run build:pages` and commit the regenerated `docs/index.html`, `docs/assets/`, `docs/levels/` and `docs/.nojekyll` along with the source changes. The script preserves `docs/reference/` and the implementation plan. GitHub serves the compiled JavaScript; the repository-root Vite source is not a deployable page by itself.

Vite's relative asset base supports repository subpaths and custom domains. The test-only static server serves both `/` and `/bounceGame/` so nested paths are checked without relying on SPA fallbacks. There are no client-side routes requiring rewrite rules.

## Implementation

- `src/game/`: deterministic simulation, original level decoder, ball physics and clock.
- `src/render/`: sprite atlas transforms, pixel renderer, HUD.
- `src/platform/`: keyboard/touch, local persistence, Nokia OTT decoding and Web Audio.
- `src/main.ts`: menus, lifecycle and browser integration.
- `public/`: original compact level files and assets.
- `tests/`: unit checks, input replay and browser integration.
- `docs/reference/`: provenance, checksums, decisions and QA evidence.

The selected reference is pinned at `rndtrash/nokia-bounce-decomp@8ddc40eba9484fc74706e27066fbd36ca6cbe25d`. See [third-party notices](THIRD_PARTY_NOTICES.md).

## Fidelity and verification limits

The original map files and pixel artwork are preserved. Movement follows the reference's integer arithmetic, collision masks, ring rims, size changes and 40 ms ticks. The browser menus, tiny bitmap score font, save system and audio synthesizer are adaptations. The game's exact original handset build has not been verified against an executable hardware oracle. All levels are included and exercise the implemented mechanisms, but a complete human playthrough of levels 2–11 and physical iOS/Android testing remain outstanding. Browser engine/device emulation is not a substitute for those checks.

The implementation intentionally bounds otherwise unbounded inflation searches and prevents repeated death in one tick. It preserves authored map quirks, including the narrow dynamic-hazard region in level 9. A pause-menu restart is available for trapped runs.
