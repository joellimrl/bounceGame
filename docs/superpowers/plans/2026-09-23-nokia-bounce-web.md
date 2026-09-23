# Nokia Bounce Browser Recreation Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task. Steps use checkboxes for tracking. This document is the implementation plan requested by the user; no separate design/specification review is required.

**Goal:** Recreate classic colour Nokia Bounce as a complete, responsive, static browser game, preserving its original levels, visual presentation, movement, puzzles, and progression as closely as the verified reference permits.

**Architecture:** A deterministic TypeScript simulation drives a low-resolution Canvas 2D renderer. Keyboard and touch adapters feed the same input state; HTML/CSS handles responsive layout and accessible menus. Assets and levels ship with the static build, with browser-local persistence and no backend.

**Tech stack:** TypeScript, Vite, Canvas 2D, Web Audio, Pointer Events, localStorage; Vitest for simulation/data tests and Playwright for browser integration. Select compatible stable versions and pin them in the lockfile during setup.

**Requirements source:** The user's request and supplied AGENTS.md. Repository inspection on 2026-09-23 found an empty Git repository with no commits or application files. This turn produces research and a plan only.

## Target and scope

The working target is the colour Series 40 / Nokia 7210 family with 11 levels. “Original Bounce” also describes earlier Nokia 9210/Symbian editions and monochrome editions. The user was offered that distinction; absent a correction, use the colour 11-level version. Do not mix handset-specific level order, menus, physics, or extra level packs.

The deliverable includes the complete campaign, original-style title/menu/HUD, instructions, sound, score, lives, checkpoints, pause/resume, unlocked-level selection, local high score, and ending. Desktop and mobile use the same gameplay. Browser adaptation includes touch buttons, mute, automatic pause on interruption, and reliable save/resume. A pause-menu restart gives a way out of a trapped run without silently changing the original levels.

Additional level packs, remastered graphics, multiplayer, leaderboards, monetization, accounts, a level editor, PWA installation, and a widened gameplay camera are outside the initial release. Developer-only map previews and replay tools support verification.

“Static page” means a generated HTML/CSS/JS/assets directory served over HTTP(S), with no server application or database. It need not be a single HTML file or work through `file://`.

## Research findings and confidence

| Evidence | What was checked | How to use it |
| --- | --- | --- |
| [Nokia's 2001 companion software manual, PDF pp. 26–29](https://my9210.bs0dd.net/Arch/9210/Documents/CDRomsw_en.pdf) | Nokia describes hoop collection to unlock exits, rubber surfaces, gravity reversal, size changes, and floating large balls. | Primary historical evidence for shared mechanics. Its 9210 controls/save menus are a different edition and must not be copied indiscriminately. |
| [Nokia Bounce decompilation](https://github.com/rndtrash/nokia-bounce-decomp/tree/8ddc40eba9484fc74706e27066fbd36ca6cbe25d) | Inspected Java logic and read all 11 binary level headers directly at commit `8ddc40eba9484fc74706e27066fbd36ca6cbe25d`. Resources include level data, sprite sheets, and three OTT sounds. | Main implementation reference, pinned for reproducibility. It is a community decompilation, not a verified official source release. |
| [Recorded Nokia 7210 v1.13 walkthrough](https://www.youtube.com/watch?v=8EYLIF4RPqM) | Located a recording whose author identifies the handset and version. The full footage has not yet been reviewed frame by frame. | Candidate visual, timing, sound, and playthrough reference. Do not assume its version matches the decompilation until compared. |
| [Bounce Zero PSP port](https://github.com/amdray/bounce_zero) | Repository documents original level loading, OTT sound parsing, sprite resources, and Nokia fonts. | Supporting parser/audio reference. It is a reimplementation and must not override original behaviour when they disagree. |
| [FreeJ2ME](https://github.com/hex007/freej2me) | Project documents Nokia/phone input mappings and desktop JAR execution. | Candidate development oracle for a matching reference build; never a runtime requirement for players. |

Specific facts observed in the pinned decompilation:

- [BounceTimer.java](https://github.com/rndtrash/nokia-bounce-decomp/blob/8ddc40eba9484fc74706e27066fbd36ca6cbe25d/src/main/java/com/nokia/mid/appl/boun/BounceTimer.java): timer period is **40 ms**, or 25 ticks per second.
- [b.java](https://github.com/rndtrash/nokia-bounce-decomp/blob/8ddc40eba9484fc74706e27066fbd36ca6cbe25d/src/main/java/com/nokia/mid/appl/boun/b.java): **12×12 tiles**, binary level loading, sprite transforms, and sky/water colours.
- [e.java](https://github.com/rndtrash/nokia-bounce-decomp/blob/8ddc40eba9484fc74706e27066fbd36ca6cbe25d/src/main/java/com/nokia/mid/appl/boun/e.java): **128×128 frame**, a **128×96 gameplay region**, bottom HUD, horizontal scrolling and vertical page transitions. Completion adds **5,000 points**.
- [f.java](https://github.com/rndtrash/nokia-bounce-decomp/blob/8ddc40eba9484fc74706e27066fbd36ca6cbe25d/src/main/java/com/nokia/mid/appl/boun/f.java): **12/16-pixel ball diameters**, ball/slope collision masks, pixel-step movement, hoop interactions, buoyancy, and boosts. Rings add **500 points**, checkpoints **200**, extra lives **1,000**; extra-life increments stop at a counter of **5**. Boosts initialize to **300 update ticks**. Checkpoint respawn restores the recorded ball size.

These are source observations, not claims that original hardware has already been reproduced. The decompilation contains unresolved names and suspicious constructs, including byte loop variables for maps wider than 127 tiles. The manifest inspected does not establish the original commercial version. Recover semantics and validate against reference execution rather than mechanically translating every line. In particular, clarify the original lives counter's meaning: the code starts at 3 and tests game over below zero.

The resource repository's license metadata and the ownership of original game assets are separate questions. Task 1 records provenance and permitted reuse per resource before anything is bundled for distribution. Any replacement asset must be recorded as a fidelity deviation; publicly available files alone do not establish an exact-replica release path.

### Verified level inventory

Dimensions are in 12-pixel tiles. Values below were read from the pinned binary files, not reconstructed from screenshots. “Moving hazards” is the dynamic-thorn count in the file.

| Level | Width × height | Rings | Starting diameter | Moving hazards |
| --- | --- | --- | --- | --- |
| 1 | 112 × 8 | 6 | 12 | 0 |
| 2 | 134 × 22 | 8 | 12 | 6 |
| 3 | 134 × 36 | 9 | 16 | 11 |
| 4 | 134 × 29 | 7 | 12 | 11 |
| 5 | 90 × 43 | 10 | 16 | 0 |
| 6 | 112 × 36 | 8 | 12 | 4 |
| 7 | 134 × 36 | 11 | 12 | 12 |
| 8 | 156 × 36 | 11 | 12 | 11 |
| 9 | 222 × 36 | 12 | 12 | 4 |
| 10 | 112 × 35 | 12 | 12 | 7 |
| 11 | 178 × 57 | 15 | 16 | 5 |

[Level resource directory](https://github.com/rndtrash/nokia-bounce-decomp/tree/8ddc40eba9484fc74706e27066fbd36ca6cbe25d/src/main/resources/levels). For additional conversion anchors: level 1 starts at tile `(2,1)` and exits at `(110,5)`; level 11 starts at `(142,37)` and exits at `(0,47)`. Their SHA-256 values are respectively `b22e1d2221a700aada442396873882e2fe4a59b52dc87a45193f1bf8592e23a5` and `020778ecff72bf3ba46fb68f4d6c130d5f39237e7d713e7a9ac59b15d066b6ef`.

## Approach selection

| Approach | Benefit | Trade-off | Decision |
| --- | --- | --- | --- |
| Custom TypeScript + Canvas 2D | Direct control of integer movement, collision masks, camera, and tiny pixel assets; straightforward static output. | Requires careful implementation and reference testing. | Recommended. |
| General-purpose web game engine | Useful scene, asset, and input tooling. | Its default physics would still need replacement to match Bounce; adds another abstraction for this small game. | Use only if a concrete later requirement justifies it. |
| Run original J2ME in a browser emulator | Potentially preserves the original program. | Browser compatibility, runtime packaging, audio and mobile controls need their own feasibility work. | Use emulation as a development reference, not the shipping architecture. |

“Responsive” does not require React. For this single game, a canvas and small DOM shell are sufficient. Rendering must never govern simulation speed. Use `requestAnimationFrame` to present the latest frame while the simulation advances in fixed 40 ms ticks. Preserve update order and integer truncation semantics. Default presentation does not interpolate the ball between ticks, preserving the original cadence.

## Global constraints

- All 11 reference maps are required for release; a one-level recreation is only an intermediate milestone.
- Preserve the original gameplay field of view. Responsive CSS scales the whole 128×128 frame uniformly; it never exposes extra tiles or stretches the ball.
- Prefer integer display scaling and nearest-neighbour pixels. When space cannot fit a useful integer scale, fit uniformly with smoothing disabled and accept uneven physical pixel widths.
- Preserve source movement, collision, water, ring, hazard, checkpoint, timer, scoring, and camera rules. Do not introduce coyote time, variable jumps, or generic physics defaults without an explicit deviation decision.
- All runtime assets are local to the build. No remote asset hotlinks, API service, sign-in, or cloud save.
- Native touch buttons support direction plus jump simultaneously, cancellation, and pointer capture. Browser interruption clears input and pauses immediately.
- Sound begins only after user interaction; blocked audio never blocks gameplay.
- Storage failure degrades to a playable in-memory session. Save data is versioned and validated before use.
- Chrome, Firefox, desktop Safari, iOS Safari, and Android Chrome are target browsers. Touch emulation supplements actual-device tests.
- Keep public npm registry configuration local to this repo because this machine defaults to internal Artifactory. Do not copy user proxy/auth configuration. Expo/EAS configuration is unnecessary for a browser-only project.

## Presentation and controls

The canvas remains the centre of the page: original red ball, brick/rubber tiles, blue sky/water, hoop artwork, pixel typography, score, life icons, and remaining-ring icons. Use a restrained dark surround and small title/controls area; a large decorative phone shell would consume useful mobile space. Reproduce menu artwork and wording from the selected reference while keeping interactive menu controls as semantic DOM buttons.

Desktop: arrows or A/D move, Up/W/Space jumps, Escape/P pauses. Also accept the historical 4/6/2 mappings. Key actions are held states, not OS key-repeat events. Mobile portrait: left/right buttons under the display on the left and jump on the right. Landscape: controls move into side gutters if height is constrained. Buttons are at least 56 CSS pixels where practical, clear of safe-area insets, with a visible pressed state. Avoid covering the gameplay region.

Provide pause, mute, restart level, and instructions through reachable buttons. Use focus indicators, readable HTML instructions and menu labels, and polite announcements for pause, level completion, and game over. Avoid announcing per-frame changes. Fullscreen is an optional progressive enhancement; ordinary browser play must remain complete without it.

[Canvas guidance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events), and [Web Audio activation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) support these browser choices.

## File and interface boundaries

```text
index.html                       Page entry
src/main.ts                      Boot, assets, and subsystem wiring
src/styles.css                   Responsive frame, menus, touch controls
src/game/model.ts                Shared level/state/input/event types
src/game/reference.ts            Verified constants and reference identity
src/game/clock.ts                Fixed tick accumulator and pause policy
src/game/simulation.ts           Authoritative ordered game tick
src/game/ball.ts                 Ball motion, size, buoyancy, boosts
src/game/collision.ts            Tile/mask collision and pixel stepping
src/game/objects.ts              Rings, hazards, checkpoints, exits, scoring
src/game/camera.ts               Original camera and page-transition state
src/game/session.ts              New game, pause, restart, progression, ending
src/render/renderer.ts           Canvas world, object ordering, HUD
src/render/atlas.ts              Sprite crops, rotations, bitmap glyphs
src/platform/input.ts            Keyboard/pointer aggregation
src/platform/audio.ts            Audio event playback and mute
src/platform/storage.ts          Versioned persistence and validation
src/ui/menus.ts                  Accessible menu and status DOM
src/data/levels/01.json…11.json   Validated runtime maps
public/assets/                  Approved sprite/font/audio files
tools/convert-levels.ts          Reproducible binary-to-JSON conversion
tools/inspect-levels.ts          Map summaries and developer previews
tests/unit/                     Simulation, parser, storage, clock tests
tests/fixtures/                 Reference metadata and short input traces
tests/e2e/                      Browser lifecycle, controls, progression
docs/reference/                 Provenance, observed behaviour, QA evidence
vite.config.ts                  Static build with relocatable asset paths
vitest.config.ts                Pure game/data test setup
playwright.config.ts            Chromium, Firefox, WebKit projects
```

Contracts: `decodeLevel(bytes: Uint8Array, id: number): LevelDefinition` is the sole binary reader. `createState(level: LevelDefinition, lives: number, score: number): GameState` creates a session state. `step(state: GameState, input: InputFrame): GameEvent[]` mutates that state by exactly one ordered game tick. `render(state: Readonly<GameState>): void` cannot mutate simulation state. `InputFrame` contains held `left`, `right`, and `jump` booleans. `GameEvent` describes sound cues and lifecycle transitions; audio and DOM code consume events outside the simulation.

`LevelDefinition` contains identity, width/height, tile size, spawn tile and diameter, exit tile, total rings, raw tile values/flags, and complete dynamic-hazard records. `GameState` contains simulation tick, ball and velocities, mutable tiles/collected-object state, hazard positions/directions, checkpoint coordinates/size, lives, score, boost ticks, exit state, camera/transition state, and lifecycle mode. Avoid converting the original masks/flags to generic solid/empty booleans.

## Review focus

1. A key held during a tab switch, pointer cancellation, or rotation must not continue moving the ball on resume — Task 7.
2. Death after inflation must restore the checkpoint's ball size and correct collection state, preventing newly introduced traps — Tasks 4 and 6.
3. Ring rims, slopes, fast boosted movement, and water flags on occupied tiles must not become generic rectangle collisions — Tasks 3–5.
4. 60/90/120/144 Hz displays and background time must not change speed or exhaust boosts — Tasks 2 and 7.
5. Missing/corrupt saves, denied storage, unavailable audio, or subpath hosting must not prevent play — Tasks 6–8.

## Task 1: Establish the reference and asset pipeline

**Files:** `docs/reference/sources.md`, `docs/reference/behaviour.md`, `docs/reference/assets.json`, `tests/fixtures/level-metadata.json`, `src/game/reference.ts`.

- [ ] Record the pinned reference commit, resource hashes, handset family, and unresolved version identity. Compare the selected recording and an executable reference before declaring a specific version match.
- [ ] Inventory every tile ID/flag, sprite crop, rotation, font, effect, and menu screen. Record resource provenance and reuse status individually, including replacements if needed.
- [ ] Document acceleration, braking, bounce, jump-hold behaviour, water transitions, ring collision, hazard order, checkpoint persistence, lives-counter semantics, and camera updates. Use tick-indexed observations where possible.
- [ ] Create reference traces for ground acceleration/braking, normal and rubber jumps, small/large water entry, a ring crossing, inflation near a wall, and checkpoint death. Store inputs and independently observed output states; never generate expected outputs from the implementation under test.
- [ ] Establish the executable oracle. The decompilation README notes missing wrappers, so do not assume it runs. If a matching original build cannot run immediately, label hardware/video comparisons and source-derived tests separately and carry that evidence gap into release assessment.

**Exit criterion:** A pinned reference pack and specific unresolved differences, with sufficient data to implement level 1. Reference uncertainty does not justify guessing or claiming exact replication.

## Task 2: Render level 1 with a deterministic clock

**Files:** build/config files, `.npmrc`, `index.html`, `src/main.ts`, `src/game/{model,clock}.ts`, `src/render/{renderer,atlas}.ts`, `src/styles.css`, `tests/unit/clock.test.ts`.

- [ ] Scaffold Vite + TypeScript, pin public npm registry, choose a supported Node version, and commit a portable lockfile. Add `dev`, `typecheck`, `test`, `test:e2e`, `build`, `preview`, `levels:convert`, and `levels:check` scripts.
- [ ] Define shared types and a fixed 40 ms accumulator with a bounded catch-up budget. Large interruptions pause and clear accumulated time; paused sessions do not accrue ticks.
- [ ] Write clock tests before implementation. Feed equal total elapsed time in 60 Hz and 120 Hz frame schedules and assert identical tick counts/remainders. Feed a long gap and assert the documented pause policy rather than a burst of movement.
- [ ] Render the 128×128 frame and correctly clipped 128×96 world, nearest-neighbour sprites, original-style HUD, and loading/error states. Use a level-1 fixture until conversion is available.
- [ ] Add a browser smoke check for visible title, successful asset loading, and correct aspect ratio at desktop and 390×844 viewport sizes.

**Exit criterion:** The reference-scale scene is visible, with deterministic tick scheduling independent of browser refresh rate.

## Task 3: Decode and validate all original level data

**Files:** `tools/{convert-levels,inspect-levels}.ts`, `src/data/levels/*.json`, `src/game/model.ts`, `tests/unit/levels.test.ts`, `tests/fixtures/level-metadata.json`.

- [ ] Decode the eight one-byte header fields: spawn X/Y, initial-size flag, exit X/Y, required hoops, width, height. Read `width × height` row-major tiles, then the dynamic-hazard count and records using the inspected source format.
- [ ] Preserve base tile IDs and water flag `0x40`; distinguish runtime mutation/redraw flags from authored data. Use ordinary numeric loop indices, including widths over 127.
- [ ] Before implementation, add parser tests for every inventory row, boundary exits such as level 11 X=0, truncated input, inconsistent counts, invalid coordinates, and unknown tile IDs. Fail clearly with level ID and byte offset.
- [ ] Verify tile/entity output and checksums. Count logical rings with their paired/oriented tiles, not each visual half. Confirm spawn diameter and all hazard path/phase data.
- [ ] Produce developer map previews for all 11 levels to inspect geometry and object placement. Review screenshots alongside the original reference.

**Example acceptance test contract:**

```ts
const level = decodeLevel(levelOneBytes, 1);
expect([level.width, level.height, level.totalRings]).toEqual([112, 8, 6]);
expect(level.spawn).toEqual({ x: 2, y: 1, diameter: 12 });
expect(level.exit).toEqual({ x: 110, y: 5 });
```

**Exit criterion:** All 11 levels convert repeatably, match the inventory, and retain every authored tile and dynamic hazard.

## Task 4: Complete level 1 with faithful ball physics

**Files:** `src/game/{simulation,ball,collision,objects,camera}.ts`, `src/platform/input.ts`, `tests/unit/{physics,collision,objects,camera}.test.ts`.

- [ ] Write reference-trace tests for acceleration, release/braking, normal jumps, repeated held jumps, wall/ceiling contact, falling, and camera transitions.
- [ ] Implement source-equivalent integer arithmetic, operation order, velocity limits, pixel-by-pixel motion, collision masks, slopes, and bounce response. Match truncation toward zero where Java integer division matters.
- [ ] Implement hoops with the original rim collision, orientation, width, collected appearance, and one-time scoring. Add spikes, extra lives, checkpoint activation, death animation, respawn, and locked/unlocked exit transitions.
- [ ] Test touching the same ring repeatedly adds exactly 500 once; a locked exit does not complete the level; the last ring unlocks it; completion awards its bonus once. Test life pickup at its cap still follows the reference score rule.
- [ ] Reproduce horizontal camera movement and vertical page changes, including any update-tick effects. Do not replace them with smooth two-axis follow.
- [ ] Complete level 1 manually and record a deterministic input replay from spawn through all six rings to the exit.

**Exit criterion:** A playable and reference-checked level 1, with no invented geometry or movement shortcuts.

## Task 5: Add the full mechanics and all 11 levels

**Files:** `src/game/{ball,collision,objects,simulation}.ts`, `src/render/{atlas,renderer}.ts`, `tests/unit/{water,boosts,hazards,respawn}.test.ts`, `tests/fixtures/replays/`.

- [ ] Implement inflation/deflation for every orientation, safe placement when growing beside geometry, small/large ball masks, and distinct air/water motion.
- [ ] Implement rubber walls/slopes, moving thorn paths and direction reversals, speed boosts, jump boosts, reversed gravity, and original timer-reset/expiry rules. Base duration on simulation updates, not wall-clock timers.
- [ ] Add fixtures for every tile ID present in the campaign. Test fast travel across spikes/rings without tunnelling, water flags on nonempty tiles, wide versus narrow hoops, slopes at boundaries, and size changes near walls.
- [ ] Test checkpoint-size restoration by activating a small-ball checkpoint, inflating elsewhere, dying, and asserting small-ball respawn with the reference's collection/hazard persistence. Cover the reverse size change too.
- [ ] Play levels in order, recording no-cheat completion replays and visual checkpoints. Give particular attention to tight passages, ring platforms, boost expiry, and the large final map.

**Exit criterion:** Every authored mechanism is supported and every level can be completed through its legitimate route. Reproduced original traps are documented separately from new defects; do not silently reshape levels to hide either.

## Task 6: Finish menus, progression, sound, and persistence

**Files:** `src/game/session.ts`, `src/ui/menus.ts`, `src/platform/{storage,audio}.ts`, `public/assets/`, `tests/unit/{session,storage,audio-events}.test.ts`, `tests/e2e/session.spec.ts`.

- [ ] Implement title, new game/unlocked-level choice, continue, instructions, high score, pause, level-complete, game-over, and campaign-ending states. Restart level restores its entry state and cannot duplicate points or lives; starting a new game clears only the active run.
- [ ] Separate in-game checkpoint respawn from browser save/resume. Preserve the reference's death behaviour. A browser snapshot must include mutable tiles, hazards/phase, checkpoint size, ball state, boosts, score, lives, level and camera state so reloading does not create duplicates or traps.
- [ ] Version and validate snapshots, reject impossible level IDs/coordinates/counters and malformed arrays, and handle read/write exceptions without interrupting play. Preserve settings and high score when discarding an invalid run.
- [ ] Recreate pickup, pop and upward/boost sound cues from the selected reference through short local samples or an inspected OTT conversion pipeline. Match pitch/rhythm and playback interruption rules; avoid invented background music.
- [ ] Start/resume audio after a gesture, provide mute, and keep playing if audio fails. Test denied/corrupt storage, obsolete schema, missing audio, repeated death, repeated exit activation, and refresh during pause.

**Exit criterion:** The complete game lifecycle survives reloads and failures without corrupting progression or blocking play.

## Task 7: Make desktop and mobile controls reliable

**Files:** `src/platform/input.ts`, `src/styles.css`, `src/ui/menus.ts`, `tests/unit/input.test.ts`, `tests/e2e/{controls,layout,lifecycle}.spec.ts`.

- [ ] Aggregate held controls per key/pointer; releasing one of two sources for the same action must not clear the other. Both keyboard and touch feed `InputFrame`.
- [ ] Use Pointer Events, pointer capture, and `touch-action` on controls. Handle `pointerup`, `pointercancel`, lost capture, blur, visibility change and orientation change. Suppress browser scrolling only for active game inputs, preserving page/menu usability.
- [ ] Implement portrait and landscape layouts, safe-area spacing, large touch targets, focus handling, and optional fullscreen fallback. Keep the playfield unobscured and square.
- [ ] Test simultaneous left+jump/right+jump, held input through pause, finger release off-button, multiple sources per action, hidden-tab return, and resize. Rotation should pause with controls released and preserve the run.
- [ ] Run layout checks at 320×568, 390×844, 844×390, 768×1024, and 1440×900. Manually play on iOS Safari and Android Chrome; Playwright emulation alone cannot establish physical multi-touch and audio reliability.

**Exit criterion:** Touch and keyboard permit the same manoeuvres, and interruption cannot leave a stuck input or consume gameplay time.

## Task 8: Verify fidelity and prepare the static release

**Files:** `tests/e2e/campaign.spec.ts`, `tests/fixtures/replays/`, `docs/reference/qa.md`, `README.md`, build configuration.

- [ ] Run deterministic campaign replays at 60/90/120/144 Hz presentation schedules. Compare simulation states and scores, with reference captures for each mechanic and level.
- [ ] Compare native-scale screenshots for sprite placement, palette, HUD, ring layering, camera positions, menu screens, and ending. Explicitly list typography/sound/reference-version differences that remain.
- [ ] Run Chromium, Firefox and WebKit browser tests plus physical-device checks. Confirm no repeated console errors, stuck controls, blocked starts, or accidental gestures.
- [ ] Run `npm run typecheck`, `npm test`, `npm run levels:check`, `npm run test:e2e`, and `npm run build`; inspect all results. Replay and browser tests must exercise the production output as well as development where relevant.
- [ ] Serve `dist/` from both `/` and a nested path such as `/bounceGame/`; verify asset loading, refresh, save/resume, and zero third-party runtime requests. Vite supports a static build; configure asset paths accordingly. [Vite deployment documentation](https://vite.dev/guide/static-deploy.html).
- [ ] Document run/build commands, controls, reference version, provenance, limitations, and hosting instructions. Supply the ready-to-host directory; actual public publishing is a separate user action/request.

**Exit criterion:** The static build completes all 11 levels and passes the device, lifecycle, data, and reference checks. Report observed fidelity and any remaining gaps; do not label unverified behaviour “pixel-perfect” or “fully identical.”

## Delivery milestones

1. **Reference and scene:** identified source, verified data pipeline, accurate low-resolution rendering.
2. **Playable first level:** movement, collision, hoops, death, checkpoints, exit and camera validated.
3. **Complete campaign:** all 11 levels and special mechanics, legitimate completion replays.
4. **Browser release:** mobile controls, menus, sound, persistence, cross-browser checks and deployable static build.

Commit each independently tested task during implementation. Use the same reference pack across tasks; when evidence changes a rule, update the affected fixture and record why. The largest uncertainty is validating reference-version identity and precise simulation behaviour, not drawing the sprites. Prove those early before polishing the surrounding page.
