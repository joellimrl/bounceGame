import { it, expect } from 'vitest';
import { GameClock } from '../../src/game/clock';
it('advances exactly 250 ticks over ten seconds at different refresh rates', () => {
  for (const hz of [60, 90, 120, 144]) {
    const c = new GameClock();
    let ticks = 0;
    for (let i = 0; i < hz * 10; i++) ticks += c.advance(1000 / hz);
    expect(ticks).toBe(250);
  }
});
it('drops long interruptions rather than simulating hidden time', () => {
  const c = new GameClock();
  c.advance(20);
  expect(c.advance(2000)).toBe(0);
  expect(c.advance(20)).toBe(0);
});
it('reset clears a partial tick', () => {
  const c = new GameClock();
  c.advance(30);
  c.reset();
  expect(c.advance(10)).toBe(0);
});
