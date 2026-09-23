import { IDLE, type InputFrame } from '../game/model';
export class InputState {
  private sources = new Map<string, keyof InputFrame>();
  set(source: string, action: keyof InputFrame) {
    this.sources.set(source, action);
  }
  release(source: string) {
    this.sources.delete(source);
  }
  clear() {
    this.sources.clear();
  }
  read(): InputFrame {
    const state = { ...IDLE };
    for (const action of this.sources.values()) state[action] = true;
    return state;
  }
}
const keys: Record<string, keyof InputFrame> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  Digit4: 'left',
  Numpad4: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Digit6: 'right',
  Numpad6: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  Digit2: 'jump',
  Numpad2: 'jump',
};
export function bindInput(
  input: InputState,
  active: () => boolean,
  pause: () => void,
  interact: () => void,
) {
  const controls = [...document.querySelectorAll<HTMLButtonElement>('[data-control]')];
  const clear = () => {
    input.clear();
    controls.forEach((b) => b.classList.remove('pressed'));
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (!e.repeat) pause();
      return;
    }
    const action = keys[e.code];
    if (!action || !active()) return;
    if (e.target instanceof HTMLElement && e.target.closest('input,select,textarea')) return;
    if (e.code === 'Space' && e.target instanceof HTMLButtonElement && !e.target.dataset.control)
      return;
    e.preventDefault();
    interact();
    input.set(`key:${e.code}`, action);
  });
  window.addEventListener('keyup', (e) => {
    input.release(`key:${e.code}`);
  });
  for (const button of controls) {
    button.addEventListener('pointerdown', (e) => {
      if (!active()) return;
      e.preventDefault();
      interact();
      button.setPointerCapture(e.pointerId);
      input.set(`pointer:${e.pointerId}`, button.dataset.control as keyof InputFrame);
      button.classList.add('pressed');
    });
    const release = (e: PointerEvent) => {
      input.release(`pointer:${e.pointerId}`);
      button.classList.remove('pressed');
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  const interrupt = () => {
    clear();
    if (active()) pause();
  };
  window.addEventListener('blur', interrupt);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) interrupt();
  });
  screen.orientation?.addEventListener('change', interrupt);
  return clear;
}
