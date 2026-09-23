import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { decodeLevel } from '../../src/game/levels';
import { createState, step } from '../../src/game/simulation';
import { IDLE, type LevelDefinition } from '../../src/game/model';
const original = (n: number) =>
  decodeLevel(
    new Uint8Array(readFileSync(`public/levels/J2MElvl.${String(n).padStart(3, '0')}`)),
    n,
  );
const room = (): LevelDefinition => ({
  id: 1,
  width: 20,
  height: 12,
  totalRings: 1,
  spawn: { x: 3, y: 8, diameter: 12 },
  exit: { x: 17, y: 8 },
  hazards: [],
  tiles: Array.from({ length: 12 }, (_, y) =>
    Array.from({ length: 20 }, (_, x) => (y === 0 || y >= 10 || x === 0 || x === 19 ? 1 : 0)),
  ),
});
const ticks = (s: any, n: number, input = IDLE) => {
  for (let i = 0; i < n; i++) step(s, input);
};
describe('source-derived ball behaviour', () => {
  it('uses integer pixel movement and source acceleration', () => {
    const s = createState(room(), 3, 0);
    ticks(s, 5, { ...IDLE, right: true });
    expect(s.ball.x).toBe(49);
    expect(s.ball.vx).toBe(30);
    expect(Number.isInteger(s.ball.y)).toBe(true);
  });
  it('supports repeated held jumps from solid ground', () => {
    const s = createState(room(), 3, 0);
    ticks(s, 30);
    const ground = s.ball.y;
    ticks(s, 5, { ...IDLE, jump: true });
    expect(s.ball.y).toBeLessThan(ground - 10);
  });
  it('small balls sink while large balls float', () => {
    for (const diameter of [12, 16] as const) {
      const l = room();
      l.spawn = { x: 8, y: 6, diameter };
      for (let y = 1; y < 10; y++) for (let x = 1; x < 19; x++) l.tiles[y][x] = 64;
      const s = createState(l, 3, 0);
      const before = s.ball.y;
      ticks(s, 10);
      expect(diameter === 12 ? s.ball.y > before : s.ball.y < before).toBe(true);
    }
  });
  it('ring pairs score only once and both halves change', () => {
    const l = room();
    l.tiles[7][6] = 13;
    l.tiles[8][6] = 14;
    const s = createState(l, 3, 0);
    for (let i = 0; i < 3; i++) s.ball.collideTile(78, 95, 7, 6);
    expect(s.score).toBe(500);
    expect(s.rings).toBe(1);
    expect(s.tiles[8][6] & 63).toBe(18);
  });
  it('narrow hoops block large balls', () => {
    const l = room();
    l.spawn.diameter = 16;
    l.tiles[7][6] = 13;
    l.tiles[8][6] = 14;
    const s = createState(l, 3, 0);
    expect(s.ball.collideTile(78, 95, 7, 6)).toBe(false);
    expect(s.rings).toBe(0);
  });
  it('death restores checkpoint size, consumes one life, and clears boosts', () => {
    const s = createState(room(), 3, 0);
    s.ball.setCheckpoint(3, 8);
    s.ball.inflate();
    s.ball.speedTicks = 100;
    s.ball.pop();
    s.ball.pop();
    ticks(s, 8);
    expect(s.ball.ballSize).toBe(12);
    expect(s.lives).toBe(2);
    expect(s.ball.speedTicks).toBe(0);
  });
  it('extra life at cap awards score once without exceeding cap', () => {
    const l = room();
    l.tiles[8][3] = 29;
    const s = createState(l, 5, 0);
    s.ball.collideTile(42, 102, 8, 3);
    s.ball.collideTile(42, 102, 8, 3);
    expect(s.score).toBe(1000);
    expect(s.lives).toBe(5);
  });
  it('gravity boost expires after 300 active ball updates', () => {
    const s = createState(room(), 3, 0);
    s.ball.gravityTicks = 300;
    for (let i = 0; i < 300; i++) s.ball.update();
    expect(s.ball.gravityTicks).toBe(0);
  });
  it('pause leaves ball, hazards and timers unchanged', () => {
    const s = createState(original(3), 3, 0);
    s.mode = 'paused';
    const before = JSON.stringify(s.snapshot());
    ticks(s, 100);
    expect(JSON.stringify(s.snapshot())).toBe(before);
  });
  it('all 11 maps can simulate arbitrary input without exceptions or nonfinite positions', () => {
    for (let n = 1; n <= 11; n++) {
      const s = createState(original(n), 3, 0);
      for (let i = 0; i < 700; i++) {
        step(s, { left: i % 200 > 140, right: i % 200 < 140, jump: i % 70 < 55 });
        expect(Number.isFinite(s.ball.x) && Number.isFinite(s.ball.y)).toBe(true);
      }
    }
  });
});
it('spikes cannot be tunnelled through at maximum velocity', () => {
  const l = room();
  l.tiles[8][7] = 3;
  const s = createState(l, 3, 0);
  s.ball.x = 70;
  s.ball.y = 102;
  s.ball.vx = 150;
  ticks(s, 3, { ...IDLE, right: true });
  expect(s.lives).toBe(2);
});
it('jump and speed powerups initialize to 300 ticks', () => {
  for (const [tile, field] of [
    [38, 'speedTicks'],
    [51, 'jumpTicks'],
    [47, 'gravityTicks'],
  ] as const) {
    const l = room();
    l.tiles[8][5] = tile;
    const s = createState(l);
    s.ball.collideTile(66, 102, 8, 5);
    expect(s.ball[field]).toBe(300);
  }
});
it('exit is solid until opened and completion bonus cannot repeat', () => {
  const l = room();
  l.tiles[8][17] = 9;
  const s = createState(l);
  expect(s.ball.collideTile(210, 102, 8, 17)).toBe(false);
  expect(s.exiting).toBe(false);
  s.exitFrame = 24;
  s.ball.collideTile(210, 102, 8, 17);
  step(s, IDLE);
  expect(s.mode).toBe('complete');
  expect(s.score).toBe(5000);
  ticks(s, 10);
  expect(s.score).toBe(5000);
});
it('final-level exit produces the campaign ending', () => {
  const l = room();
  l.id = 11;
  l.tiles[8][17] = 9;
  const s = createState(l);
  s.exitFrame = 24;
  s.ball.collideTile(210, 102, 8, 17);
  step(s, IDLE);
  expect(s.mode).toBe('won');
});
