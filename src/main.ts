import './styles.css';
import { decodeLevel } from './game/levels';
import { createState, restoreState, step, type GameState } from './game/simulation';
import { GameClock } from './game/clock';
import { createAtlas, loadImage } from './render/atlas';
import { Renderer } from './render/renderer';
import { InputState, bindInput } from './platform/input';
import { GameAudio } from './platform/audio';
import { browserStorage, readProgress, writeProgress, validateSnapshot } from './platform/storage';
const element = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const input = new InputState(),
  clock = new GameClock(),
  audio = new GameAudio(),
  storage = browserStorage(),
  progress = readProgress(storage);
const dialog = element<HTMLDialogElement>('info'),
  menu = element('menu'),
  game = element<HTMLCanvasElement>('game');
const base = import.meta.env.BASE_URL;
let state: GameState | undefined,
  renderer: Renderer,
  clearInput = () => input.clear();
let lastTime = 0,
  lastSave = 0,
  loaded = false,
  returnFocus: HTMLElement | null = null;
audio.muted = progress.muted;
const playing = () => state?.mode === 'playing';
const announce = (text: string) => {
  element('announcement').textContent = text;
};
function save() {
  if (state) {
    progress.highScore = Math.max(progress.highScore, state.score);
    progress.run = state.mode === 'gameover' || state.mode === 'won' ? undefined : state.snapshot();
  }
  if (!writeProgress(storage, progress))
    element('save-note').textContent = 'Storage unavailable. This session still plays.';
  element('best').innerHTML =
    `Best score <strong>${String(progress.highScore).padStart(7, '0')}</strong>`;
}
function soundLabel() {
  element('sound').textContent = audio.muted ? 'Sound off' : 'Sound on';
  element('sound').setAttribute('aria-pressed', String(audio.muted));
}
soundLabel();
element('sound').onclick = () => {
  audio.muted = !audio.muted;
  progress.muted = audio.muted;
  if (audio.muted) audio.stop();
  else audio.unlock();
  soundLabel();
  save();
};
function button(text: string, action: () => void, primary = false, disabled = false) {
  const b = document.createElement('button');
  b.textContent = text;
  b.className = primary ? 'primary' : 'secondary';
  b.disabled = disabled;
  b.onclick = action;
  menu.append(b);
  return b;
}
function renderMenu() {
  const mode = state?.mode;
  document.body.classList.toggle('session-live', mode === 'playing');
  element<HTMLButtonElement>('pause').disabled = !state || !['playing', 'paused'].includes(mode!);
  element('pause').innerHTML = mode === 'paused' ? 'Resume' : 'Pause <kbd>Esc</kbd>';
  element('level-label').textContent = state
    ? `Level ${state.level.id} / 11`
    : '11 levels. One red ball.';
  const message = element('screen-message');
  message.hidden = !state || mode === 'playing';
  const titles = {
    playing: 'Keep on bouncing.',
    paused: 'Take a breather.',
    complete: 'Nicely done.',
    gameover: 'One more bounce?',
    won: 'You made it.',
  };
  element('menu-title').textContent = mode ? titles[mode] : 'Ready to roll?';
  element('menu-kicker').textContent = state
    ? `Level ${state.level.id} of the original 11`
    : 'Welcome back to the small screen.';
  element('menu-description').textContent =
    mode === 'playing'
      ? `${state!.level.totalRings - state!.rings} rings to go. The exit opens when you have them all.`
      : mode === 'paused'
        ? 'Your game is paused. Pick up right where you left off.'
        : mode === 'complete'
          ? `Every ring collected. Score: ${state!.score.toLocaleString()}.`
          : mode === 'gameover'
            ? `Final score: ${state!.score.toLocaleString()}. Your unlocked levels are saved.`
            : mode === 'won'
              ? `All 11 levels complete. Final score: ${state!.score.toLocaleString()}.`
              : 'Collect every ring. Find the exit. Watch the spikes.';
  if (state && mode !== 'playing')
    message.innerHTML =
      mode === 'paused'
        ? 'Paused<small>Your adventure can wait.</small>'
        : mode === 'complete'
          ? 'Level complete<small>All rings collected.</small>'
          : mode === 'won'
            ? 'You did it!<small>All 11 levels complete.</small>'
            : 'Game over<small>Every bounce is a fresh start.</small>';
  menu.replaceChildren();
  if (mode === 'playing') {
    button('Pause game', togglePause, true);
    button('How to play', instructions);
  } else if (mode === 'paused') {
    button('Resume game', resume, true);
    button('Restart level', () => start(state!.level.id, state!.entryLives, state!.entryScore));
    button('Main menu', home);
  } else if (mode === 'complete') {
    button('Next level', () => start(state!.level.id + 1, state!.lives, state!.score), true);
    button('Main menu', home);
  } else if (mode === 'gameover' || mode === 'won') {
    button('Play again', () => start(1), true);
    button('Choose level', chooseLevel);
    button('Main menu', home);
  } else {
    button('New game', () => start(1), true);
    button('Continue', continueRun, false, !progress.run);
    button('Choose level', chooseLevel);
    button('How to play', instructions);
  }
  element('best').innerHTML =
    `Best score <strong>${String(progress.highScore).padStart(7, '0')}</strong>`;
}
function pause() {
  if (!playing()) return;
  state!.mode = 'paused';
  state!.ball.clearInput();
  clearInput();
  clock.reset();
  audio.stop();
  save();
  renderMenu();
  announce('Game paused.');
}
function resume() {
  if (state?.mode !== 'paused') return;
  state.mode = 'playing';
  clearInput();
  clock.reset();
  lastTime = performance.now();
  audio.unlock();
  renderMenu();
  game.focus({ preventScroll: true });
  announce('Game resumed.');
}
function togglePause() {
  if (dialog.open) return;
  if (playing()) pause();
  else resume();
}
function home() {
  save();
  state = undefined;
  clearInput();
  audio.stop();
  renderer.splash(splash);
  renderMenu();
  menu.querySelector('button')?.focus({ preventScroll: true });
}
function start(id: number, lives = 3, score = 0) {
  state = createState(levels[id - 1], lives, score);
  clearInput();
  clock.reset();
  lastTime = performance.now();
  audio.unlock();
  renderer.render(state);
  renderMenu();
  save();
  game.focus({ preventScroll: true });
  announce(`Level ${id}. Collect ${state.level.totalRings} rings.`);
}
function continueRun() {
  const raw = progress.run;
  const id = (raw as { level?: unknown })?.level;
  const snapshot =
    typeof id === 'number' && levels[id - 1] ? validateSnapshot(raw, levels[id - 1]) : null;
  if (!snapshot) {
    progress.run = undefined;
    writeProgress(storage, progress);
    renderMenu();
    showInfo(
      '<h2>Start a fresh game</h2><p>The saved run could not be restored. Your high score and unlocked levels are still here.</p>',
    );
    return;
  }
  state = restoreState(levels[snapshot.level - 1], snapshot);
  if (state.mode === 'playing') state.mode = 'paused';
  renderer.render(state);
  renderMenu();
  if (state.mode === 'paused') resume();
}
function showInfo(html: string) {
  pause();
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  element('info-content').innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
function closeInfo() {
  dialog.close();
  returnFocus?.focus({ preventScroll: true });
}
element('close-info').onclick = closeInfo;
element('done-info').onclick = closeInfo;
function instructions() {
  showInfo(
    '<h2>A little bounce goes a long way.</h2><p>Move with <strong>← / →</strong> or <strong>A / D</strong>. Hold <strong>Space, ↑ or W</strong> to keep jumping. On touchscreens, hold a direction and Jump together.</p><ul><li>Pass through every yellow ring to open the exit.</li><li>Spikes and moving jacks pop your ball.</li><li>Crystals mark checkpoints; crystal balls give an extra life.</li><li>Inflated balls float in water. Small balls sink and fit narrow gaps.</li><li>Blue rubber builds higher bounces. Power-ups briefly change speed, jump or gravity.</li></ul><p>Press <strong>Esc / P</strong> to pause. The old phone keys <strong>4 / 6 / 2</strong> work too.</p>',
  );
}
function chooseLevel() {
  showInfo(
    `<h2>Choose a level</h2><p>Finish a level to unlock the next.</p><div class="level-grid">${levels.map((_, i) => `<button class="quiet-button" data-level="${i + 1}" ${i + 1 > progress.unlocked ? 'disabled' : ''} aria-label="Level ${i + 1}${i + 1 > progress.unlocked ? ', locked' : ''}">${i + 1}${i + 1 > progress.unlocked ? ' ·' : ''}</button>`).join('')}</div>`,
  );
  dialog.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(
    (b) =>
      (b.onclick = () => {
        dialog.close();
        start(Number(b.dataset.level));
      }),
  );
}
element('about').onclick = () =>
  showInfo(
    '<h2>Small screen. Lasting memories.</h2><p>A browser recreation of the classic colour Nokia Bounce, with all 11 original maps, pixel artwork and tone sequences.</p><p>The game runs entirely in your browser. Progress is saved on this device; it does not sync between devices.</p><p>This is an unofficial fan recreation. Original game materials belong to their respective owners. Behaviour is based on the <a href="https://github.com/rndtrash/nokia-bounce-decomp" target="_blank" rel="noreferrer">community decompilation</a>; the small HUD font and browser menus are adapted.</p>',
  );
element('pause').onclick = togglePause;
element('fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector('.console')?.requestFullscreen();
  } catch {
    announce('Fullscreen is unavailable. You can keep playing in this window.');
  }
};
clearInput = bindInput(input, playing, togglePause, () => audio.unlock());
window.addEventListener('pagehide', () => {
  pause();
  save();
});
const levels: ReturnType<typeof decodeLevel>[] = [];
let splash: HTMLImageElement;
async function boot() {
  try {
    const [sheet, title, maps] = await Promise.all([
      loadImage(`${base}assets/objects_nm.png`),
      loadImage(`${base}assets/bouncesplash.png`),
      Promise.all(
        Array.from({ length: 11 }, async (_, i) => {
          const r = await fetch(`${base}levels/J2MElvl.${String(i + 1).padStart(3, '0')}`);
          if (!r.ok) throw new Error(`Level ${i + 1} failed to load`);
          return decodeLevel(new Uint8Array(await r.arrayBuffer()), i + 1);
        }),
      ),
    ]);
    levels.splice(0, levels.length, ...maps);
    splash = title;
    renderer = new Renderer(game, createAtlas(sheet));
    renderer.splash(splash);
    loaded = true;
    renderMenu();
    void audio.load(`${base}assets/`);
    requestAnimationFrame(frame);
  } catch (error) {
    element('menu-title').textContent = 'Couldn’t load the game';
    element('menu-description').textContent = 'Check your connection and try again.';
    menu.replaceChildren();
    button('Try again', () => void boot(), true);
    console.error(error);
  }
}
function frame(now: number) {
  const elapsed = lastTime ? now - lastTime : 0;
  lastTime = now;
  if (playing() && elapsed > 240) pause();
  if (playing()) {
    const ticks = clock.advance(elapsed);
    for (let i = 0; i < ticks && playing(); i++) {
      const before = state!.mode;
      for (const cue of step(state!, input.read())) audio.play(cue);
      if (state!.mode !== before) {
        clearInput();
        audio.stop();
        progress.unlocked = Math.max(
          progress.unlocked,
          Math.min(
            11,
            state!.level.id + (state!.mode === 'complete' || state!.mode === 'won' ? 1 : 0),
          ),
        );
        save();
        renderMenu();
        announce(
          state!.mode === 'complete'
            ? `Level ${state!.level.id} complete.`
            : state!.mode === 'won'
              ? 'All levels complete!'
              : 'Game over.',
        );
      }
    }
    if (ticks) {
      renderer.render(state!);
      if (state!.mode === 'playing')
        element('menu-description').textContent =
          `${state!.level.totalRings - state!.rings} rings to go. The exit opens when you have them all.`;
    }
    if (now - lastSave > 2000) {
      save();
      lastSave = now;
    }
  } else clock.reset();
  if (loaded) requestAnimationFrame(frame);
}
void boot();
