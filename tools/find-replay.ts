// Developer search utility. Produces a legitimate input-only level-1 replay.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { decodeLevel } from '../src/game/levels';
import { GameState, step } from '../src/game/simulation';
import { Ball } from '../src/game/ball';
import type { InputFrame } from '../src/game/model';
const level = decodeLevel(new Uint8Array(readFileSync('public/levels/J2MElvl.001')), 1);
function copy(s: GameState) {
  const c = Object.assign(Object.create(GameState.prototype), s) as GameState;
  c.tiles = s.tiles.map((r) => r.slice());
  c.hazards = structuredClone(s.hazards);
  c.events = [];
  c.ball = Object.assign(Object.create(Ball.prototype), s.ball, { world: c });
  c.sounds = { pickup: { play: () => {} }, pop: { play: () => {} }, up: { play: () => {} } };
  return c;
}
const actions: InputFrame[] = [
  { left: false, right: true, jump: false },
  { left: false, right: true, jump: true },
  { left: false, right: false, jump: true },
  { left: false, right: false, jump: false },
  { left: true, right: false, jump: true },
  { left: true, right: false, jump: false },
];
let beam = [{ s: new GameState(level), path: [] as number[] }];
let winner: (typeof beam)[number] | undefined;
for (let depth = 0; depth < 200; depth++) {
  const next: typeof beam = [];
  const seen = new Set<string>();
  for (const node of beam)
    for (let a = 0; a < actions.length; a++) {
      const s = copy(node.s);
      for (let i = 0; i < 5 && s.mode === 'playing'; i++) step(s, actions[a]);
      if (s.lives < 3 || s.ball.phase !== 0) continue;
      const path = [...node.path, a];
      if (s.mode === 'complete') {
        winner = { s, path };
        break;
      }
      const b = s.ball,
        key = [
          Math.round(b.x / 2),
          Math.round(b.y / 2),
          b.vx,
          Math.round(b.vy / 5),
          s.rings,
          b.grounded,
          b.slideCounter,
        ].join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      next.push({ s, path });
    }
  if (winner) break;
  next.sort((a, b) => b.s.ball.x + b.s.rings * 50 - (a.s.ball.x + a.s.rings * 50));
  beam = next.slice(0, 240);
  if (depth % 20 === 0) console.log('search', depth, beam[0]?.s.ball.x, beam[0]?.s.rings);
  if (!beam.length) break;
}
if (!winner) throw new Error('No route found within beam budget');
mkdirSync('tests/fixtures/replays', { recursive: true });
writeFileSync(
  'tests/fixtures/replays/level-01.json',
  JSON.stringify(
    {
      level: 1,
      ticksPerAction: 5,
      actions: winner.path.map((a) => actions[a]),
      score: winner.s.score,
      lives: winner.s.lives,
    },
    null,
    2,
  ) + '\n',
);
console.log('Solved level 1', winner.s.tick, winner.s.score, winner.path.length);
