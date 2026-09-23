# Verification — 23 September 2026

Tested locally with Node 22.22.0 against the production build.

| Check | Result |
| --- | --- |
| `npm test` | 51 tests passed across 5 files |
| `npm run build` | TypeScript check and Vite static build passed |
| `npm run format:check` | Passed |
| `npm run levels:inspect` | All 11 original level headers and SHA-256 hashes inspected |
| `npm run test:e2e` | 40 passed, 2 intentionally skipped |
| Browser engines | Chromium, Firefox, WebKit |
| Viewports per engine | 320×568, 390×844, 844×390, 768×1024, 1440×900 |
| Hosting paths | `/` and `/bounceGame/`, using the built files |

The two skips are the Firefox/WebKit instances of a Chromium-CDP-only simultaneous two-finger test. Pointer controls are tested in all three engines. All 11 levels are opened and rendered in each engine. Other checks exercise keyboard input, pointer release outside buttons, interruption, pause/resume, reload persistence, locked progression, corrupt saves, unavailable storage/audio, and help-dialog Escape behavior.

A legitimate input-only replay finishes level 1 in 370 simulation ticks, with six rings, a score of 9400 and a life counter of 4. It produces the same result under multiple display refresh rates. All 11 maps also receive simulation smoke tests; these are not completion proofs.

Live desktop, portrait and landscape presentations were inspected in Edge. Verification caught and fixed Escape accidentally resuming behind a dialog and a six-pixel canvas aspect-ratio distortion in WebKit. An independent code review caught corrupt-save method replacement and inconsistent death/campaign states; regression tests reproduce the failures before the fixes and pass afterward.

## Still unverified

- Exact parity with a specific executable Nokia handset release, including timing and audio output.
- Full legitimate completion of levels 2–11, either by a player or recorded input replay.
- Physical iOS/Android devices, including hardware-specific audio and gesture behavior.
- Running the included workflow on GitHub or opening an actual GitHub Pages deployment.

These are remaining acceptance checks, not claims satisfied by browser emulation. The application, all original levels, local build and deployment configuration are provided for playtesting.
