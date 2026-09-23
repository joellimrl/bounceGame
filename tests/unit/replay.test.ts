import { readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { decodeLevel } from '../../src/game/levels';
import { createState, step } from '../../src/game/simulation';
import { GameClock } from '../../src/game/clock';
import type { InputFrame } from '../../src/game/model';
const replay = JSON.parse(readFileSync('tests/fixtures/replays/level-01.json', 'utf8')) as {
  actions: InputFrame[];
  ticksPerAction: number;
  score: number;
  lives: number;
};
it.each([60, 90, 120, 144])('completes original level 1 without cheats at %i Hz', (hz) => {
  const level = decodeLevel(new Uint8Array(readFileSync('public/levels/J2MElvl.001')), 1),
    s = createState(level),
    clock = new GameClock();
  for (let frame = 0; frame < hz * 30 && s.mode === 'playing'; frame++)
    for (let ticks = clock.advance(1000 / hz); ticks > 0 && s.mode === 'playing'; ticks--) {
      const input = replay.actions[Math.floor(s.tick / replay.ticksPerAction)];
      expect(input).toBeDefined();
      step(s, input);
    }
  expect(s.mode).toBe('complete');
  expect(s.rings).toBe(6);
  expect(s.score).toBe(9400);
  expect(s.lives).toBe(4);
  expect(s.tick).toBe(370);
});
