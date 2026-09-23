import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { InputState } from '../../src/platform/input';
import { validateSnapshot, readProgress, writeProgress } from '../../src/platform/storage';
import { decodeOtt } from '../../src/platform/ott';
import { decodeLevel } from '../../src/game/levels';
import { createState, restoreState, step } from '../../src/game/simulation';
import { IDLE } from '../../src/game/model';
const level = decodeLevel(new Uint8Array(readFileSync('public/levels/J2MElvl.001')), 1);
it('aggregates independent pointers and keyboard sources', () => {
  const i = new InputState();
  i.set('key:right', 'right');
  i.set('pointer:1', 'right');
  i.set('pointer:2', 'jump');
  i.release('pointer:1');
  expect(i.read()).toEqual({ left: false, right: true, jump: true });
  i.clear();
  expect(i.read()).toEqual(IDLE);
});
it('releases only the cancelled source', () => {
  const i = new InputState();
  i.set('1', 'left');
  i.set('2', 'jump');
  i.release('2');
  expect(i.read()).toEqual({ ...IDLE, left: true });
});
it('accepts a real snapshot and restores the next identical simulation tick', () => {
  const s = createState(level);
  for (let i = 0; i < 10; i++) step(s, { ...IDLE, right: true });
  const snap = validateSnapshot(JSON.parse(JSON.stringify(s.snapshot())), level);
  expect(snap).not.toBeNull();
  const r = restoreState(level, snap!);
  step(s, IDLE);
  step(r, IDLE);
  expect(r.snapshot()).toEqual(s.snapshot());
});
it('rejects impossible saves before accessing their fields', () => {
  for (const raw of [null, {}, [], { version: 1 }, 'bad'])
    expect(validateSnapshot(raw, level)).toBeNull();
  const snap = createState(level).snapshot();
  snap.ball.x = 1e90;
  expect(validateSnapshot(snap, level)).toBeNull();
});
it('rejects corrupt tile rows and mismatched checkpoint size', () => {
  const snap = createState(level).snapshot();
  snap.tiles[0] = [];
  expect(validateSnapshot(snap, level)).toBeNull();
  const second = createState(level).snapshot();
  second.ball.checkpointSize = 0;
  expect(validateSnapshot(second, level)).toBeNull();
});
it.each([{ world: null }, { update: 0 }])(
  'discards unexpected saved ball properties: %j',
  (extra) => {
    const raw = createState(level).snapshot();
    Object.assign(raw.ball, extra);
    const valid = validateSnapshot(raw, level)!;
    expect(valid).not.toBeNull();
    const restored = restoreState(level, valid);
    expect(() => step(restored, IDLE)).not.toThrow();
    expect(restored.tick).toBe(1);
    for (const key of Object.keys(extra)) expect(valid.ball).not.toHaveProperty(key);
  },
);
it('rejects contradictory death and campaign states', () => {
  for (const [phase, popTicks] of [
    [2, 0],
    [0, 3],
    [1, 3],
  ]) {
    const snap = createState(level).snapshot();
    Object.assign(snap.ball, { phase, popTicks });
    expect(validateSnapshot(snap, level)).toBeNull();
  }
  const last = decodeLevel(new Uint8Array(readFileSync('public/levels/J2MElvl.011')), 11);
  const final = createState(last).snapshot();
  final.mode = 'complete';
  expect(validateSnapshot(final, last)).toBeNull();
  const early = createState(level).snapshot();
  early.mode = 'won';
  expect(validateSnapshot(early, level)).toBeNull();
});
it('allows saves throughout a real death and respawn', () => {
  const state = createState(level);
  state.ball.pop();
  for (let tick = 0; tick < 10; tick++) {
    expect(validateSnapshot(state.snapshot(), level)).not.toBeNull();
    step(state, IDLE);
  }
});
it('survives inaccessible storage', () => {
  const storage = {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('quota');
    },
  };
  expect(readProgress(storage).unlocked).toBe(1);
  expect(writeProgress(storage, {})).toBe(false);
});
it('restores progress and caps invalid metadata', () => {
  const st = { getItem: () => JSON.stringify({ unlocked: 7, highScore: 55000, muted: true }) };
  expect(readProgress(st)).toMatchObject({ unlocked: 7, highScore: 55000, muted: true });
  expect(readProgress({ getItem: () => '{' }).unlocked).toBe(1);
});
it.each(['pop', 'pickup', 'up'])('decodes original %s tone data', (name) => {
  const notes = decodeOtt(new Uint8Array(readFileSync(`public/assets/${name}.ott`)));
  expect(notes.length).toBeGreaterThan(0);
  expect(notes.every((n) => Number.isFinite(n.frequency) && n.duration > 0 && n.duration < 5)).toBe(
    true,
  );
});
it('rejects truncated sound files', () =>
  expect(() => decodeOtt(new Uint8Array([2, 74]))).toThrow());
