# Implementation ledger — 2026-09-23-nokia-bounce-web

Approved plan: ../superpowers/plans/2026-09-23-nokia-bounce-web.md

- Setup: empty repository; created codex/nokia-bounce in the existing workspace. No existing application/baseline tests.
- Ruling: keep the empty repo in place on a feature branch; a second checkout would not protect any pre-existing application state.
- Pre-flight: level definitions feed simulation and renderer; simulation events feed audio and UI; snapshots serialize the same simulation. Shared contracts will be checked by TypeScript.
- Ruling: keep original compact binary levels as runtime assets with a tested decoder instead of an unnecessary JSON conversion step. Same data, fewer generated copies to drift.
- Source: rndtrash/nokia-bounce-decomp at 8ddc40eba9484fc74706e27066fbd36ca6cbe25d. Public files fetched without executing downloaded code.
- Reference defects found: byte indices cannot address maps wider than 127; dynamic hazard records are 8 bytes, not the 10 reads shown in decompilation. Binary lengths and Bounce Zero parser agree on 8.
- Fidelity evidence: source-derived rules and original binary assets; no verified original runtime/hardware oracle available yet. Do not claim exact hardware equivalence.
- Presentation: original pixels inside a midnight-blue surround (#101b32), silver text (#d9e0ed), sky blue (#b0e0f0), brick red (#e33a3f), blue HUD (#0853aa). Quiet system sans shell; custom small bitmap HUD. The game itself is the focal point. Touch controls outside the canvas.
- Task 1: reference assets and provenance manifest captured; no verified original-runtime oracle. Source-derived fidelity baseline is explicit.
- Tasks 2–3: decoder and 40 ms clock tests RED→GREEN, all 11 inventory rows verified. Original level 9 has a one-tile-wide moving-hazard region; retain its source behaviour rather than reject the map.
- Tasks 4–5: TypeScript behaviour port preserves masks, integer truncation and update order. Source-derived physics tests GREEN, all 11 maps survive arbitrary input smoke tests. Full campaign completion is not yet independently established.
- Ruling: limit impossible inflation displacement searches to 48 pixels with small-ball fallback and make death idempotent. Avoids a hung browser/repeated life consumption; alters only pathological collision cases.
- Reference arithmetic correction: five rightward ticks move 0+1+1+2+3=7 pixels, from x=42 to x=49; corrected the test's hand-calculated expectation of 50.
- Task 6: versioned saves, source OTT decoding, progression and original pixel renderer implemented. Platform tests RED→GREEN.
- Task 7: responsive UI implemented; live desktop/mobile screenshots inspected in Edge. Production browser checks pass on Chromium, Firefox and WebKit, including all 11 level menus, five viewport sizes, persistence and nested hosting.
- Task 8: static build, GitHub Pages workflow, README and QA report prepared. Local verification is complete within the limits listed in qa.md; publishing was not requested.
- Final review: independent read-only review reproduced two corrupt-save failures. Known-field restoration now prevents saved properties from replacing ball methods/world; validation rejects contradictory death countdowns and final-level modes. Regression tests failed before fixes and pass afterward.
- Final evidence: 51 unit tests passed, 40 browser tests passed, 2 intentionally skipped (Chromium-only multi-touch transport); TypeScript, production build, formatting and original-level inventory passed.
- Remaining acceptance gaps: reference hardware equivalence, legitimate completion replays for levels 2–11, physical iOS/Android checks and actual hosted deployment. Do not mark those plan criteria as verified.
