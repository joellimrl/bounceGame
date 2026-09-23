import { Ball } from './ball';
import type { LevelDefinition, Hazard, InputFrame, SoundCue, Mode } from './model';

export const BALL_FIELDS = [
  'x',
  'y',
  'vx',
  'vy',
  'input',
  'ballSize',
  'radius',
  'checkpointX',
  'checkpointY',
  'checkpointSize',
  'phase',
  'jumpBoost',
  'speedTicks',
  'gravityTicks',
  'jumpTicks',
  'grounded',
  'rubber',
  'slide',
  'slideCounter',
  'popTicks',
] as const;
export interface Snapshot {
  version: 1;
  level: number;
  tick: number;
  mode: Mode;
  lives: number;
  score: number;
  rings: number;
  entryLives: number;
  entryScore: number;
  tiles: number[][];
  hazards: Hazard[];
  ball: Record<(typeof BALL_FIELDS)[number], number | boolean>;
  cameraX: number;
  cameraY: number;
  exitFrame: number;
  exiting: boolean;
}
export class GameState {
  ball: Ball;
  tiles: number[][];
  hazards: Hazard[];
  tick = 0;
  rings = 0;
  cameraX = 0;
  cameraY = 0;
  exitFrame = 0;
  mode: Mode = 'playing';
  exiting = false;
  invincible = false;
  events: SoundCue[] = [];
  entryLives: number;
  entryScore: number;
  sounds: Record<SoundCue, { play(n: number): void }>;
  constructor(
    public level: LevelDefinition,
    public lives = 3,
    public score = 0,
  ) {
    this.tiles = level.tiles.map((row) => [...row]);
    this.hazards = structuredClone(level.hazards);
    this.entryLives = lives;
    this.entryScore = score;
    const sound = (cue: SoundCue) => ({
      play: () => {
        this.events.push(cue);
      },
    });
    this.sounds = { pickup: sound('pickup'), pop: sound('pop'), up: sound('up') };
    this.ball = new Ball(
      level.spawn.x * 12 + 6,
      level.spawn.y * 12 + 6,
      level.spawn.diameter,
      this,
    );
    this.ball.setCheckpoint(level.spawn.x, level.spawn.y);
    this.updateCamera();
  }
  get exitOpen() {
    return this.exitFrame >= 24;
  }
  addScore(points: number) {
    this.score += points;
  }
  findHazard(x: number, y: number) {
    return this.hazards.findIndex(
      (h) => x >= h.min.x && x < h.max.x && y >= h.min.y && y < h.max.y,
    );
  }
  updateCamera() {
    this.cameraX = Math.max(0, Math.min(this.ball.x - 64, this.level.width * 12 - 144));
    while (this.ball.y - 6 < this.cameraY) this.cameraY -= 84;
    while (this.ball.y + 6 > this.cameraY + 96) this.cameraY += 84;
  }
  snapshot(): Snapshot {
    const ball = Object.fromEntries(BALL_FIELDS.map((k) => [k, this.ball[k]])) as Snapshot['ball'];
    return structuredClone({
      version: 1,
      level: this.level.id,
      tick: this.tick,
      mode: this.mode,
      lives: this.lives,
      score: this.score,
      rings: this.rings,
      entryLives: this.entryLives,
      entryScore: this.entryScore,
      tiles: this.tiles,
      hazards: this.hazards,
      ball,
      cameraX: this.cameraX,
      cameraY: this.cameraY,
      exitFrame: this.exitFrame,
      exiting: this.exiting,
    });
  }
}
export function createState(level: LevelDefinition, lives = 3, score = 0) {
  return new GameState(level, lives, score);
}
export function restoreState(level: LevelDefinition, snapshot: Snapshot) {
  const s = createState(level, snapshot.entryLives, snapshot.entryScore);
  for (const key of [
    'tick',
    'mode',
    'lives',
    'score',
    'rings',
    'entryLives',
    'entryScore',
    'cameraX',
    'cameraY',
    'exitFrame',
    'exiting',
  ] as const)
    (s as unknown as Record<string, unknown>)[key] = snapshot[key];
  s.tiles = structuredClone(snapshot.tiles);
  s.hazards = structuredClone(snapshot.hazards);
  // Never allow persisted data to overwrite methods or the live world reference.
  for (const key of BALL_FIELDS)
    (s.ball as unknown as Record<string, number | boolean>)[key] = snapshot.ball[key];
  s.ball.input = 0;
  s.events = [];
  return s;
}
export function step(state: GameState, input: InputFrame): SoundCue[] {
  state.events = [];
  if (state.mode !== 'playing') return [];
  state.tick++;
  state.ball.input = (input.left ? 1 : 0) | (input.right ? 2 : 0) | (input.jump ? 8 : 0);
  if (state.ball.y - 6 < state.cameraY || state.ball.y + 6 > state.cameraY + 96)
    state.updateCamera();
  else state.ball.update();
  if (state.ball.phase === 1) {
    if (state.lives < 0) {
      state.mode = 'gameover';
      return state.events;
    }
    const { checkpointX: x, checkpointY: y, checkpointSize: size } = state.ball;
    state.ball = new Ball(x * 12 + 6, y * 12 + 6, size, state);
    state.ball.setCheckpoint(x, y);
    state.updateCamera();
  }
  for (const h of state.hazards) {
    for (const axis of ['x', 'y'] as const) {
      const max = (h.max[axis] - h.min[axis] - 2) * 12;
      h.offset[axis] += h.velocity[axis];
      if (h.offset[axis] < 0) h.offset[axis] = 0;
      else if (h.offset[axis] > max) h.offset[axis] = max;
      if (h.offset[axis] === 0 || h.offset[axis] === max) h.velocity[axis] *= -1;
    }
  }
  state.cameraX = Math.max(0, Math.min(state.ball.x - 64, state.level.width * 12 - 144));
  if (
    state.rings === state.level.totalRings &&
    (state.level.exit.x + 1) * 12 > state.cameraX &&
    state.level.exit.x * 12 < state.cameraX + 128 &&
    state.level.exit.y * 12 >= state.cameraY - 24 &&
    state.level.exit.y * 12 < state.cameraY + 96
  )
    state.exitFrame = Math.min(24, state.exitFrame + 4);
  if (state.exiting) {
    state.exiting = false;
    state.addScore(5000);
    state.mode = state.level.id === 11 ? 'won' : 'complete';
  }
  return state.events;
}
