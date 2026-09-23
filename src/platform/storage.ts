import type { LevelDefinition } from '../game/model';
import { BALL_FIELDS, type Snapshot } from '../game/simulation';
export interface Progress {
  unlocked: number;
  highScore: number;
  muted: boolean;
  run?: unknown;
}
const KEY = 'bounce.classic.v1';
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export function validateSnapshot(raw: unknown, level: LevelDefinition): Snapshot | null {
  if (!object(raw) || raw.version !== 1 || raw.level !== level.id) return null;
  const s = raw as unknown as Snapshot;
  if (
    !['playing', 'paused', 'complete', 'gameover', 'won'].includes(s.mode) ||
    !integer(s.tick, 0, 1e9) ||
    !integer(s.lives, -1, 5) ||
    !integer(s.score, 0, 1e9) ||
    !integer(s.rings, 0, level.totalRings) ||
    !integer(s.entryLives, 0, 5) ||
    !integer(s.entryScore, 0, s.score)
  )
    return null;
  if (
    !integer(s.cameraX, 0, level.width * 12) ||
    !integer(s.cameraY, 0, level.height * 12) ||
    !integer(s.exitFrame, 0, 24) ||
    typeof s.exiting !== 'boolean'
  )
    return null;
  if (
    !Array.isArray(s.tiles) ||
    s.tiles.length !== level.height ||
    s.tiles.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== level.width ||
        row.some((t) => !integer(t, 0, 255) || (t & 63) > 54),
    )
  )
    return null;
  // Only original tile identities and their collectible-state transitions are valid.
  for (let y = 0; y < level.height; y++)
    for (let x = 0; x < level.width; x++) {
      const original = level.tiles[y][x] & 63,
        current = s.tiles[y][x] & 63;
      const allowed = [original];
      if ([13, 14, 15, 16, 21, 22, 23, 24].includes(original)) allowed.push(original + 4);
      if (original === 7) allowed.push(0, 8);
      if (original === 29) allowed.push(0);
      if (!allowed.includes(current)) return null;
    }
  if (
    s.tiles.flat().filter((t) => [13, 15, 21, 23].includes(t & 63)).length !==
    level.totalRings - s.rings
  )
    return null;
  if (!Array.isArray(s.hazards) || s.hazards.length !== level.hazards.length) return null;
  for (let i = 0; i < s.hazards.length; i++) {
    const h = s.hazards[i],
      ref = level.hazards[i];
    if (!object(h) || !object(h.min) || !object(h.max) || !object(h.offset) || !object(h.velocity))
      return null;
    for (const axis of ['x', 'y'] as const)
      if (
        h.min[axis] !== ref.min[axis] ||
        h.max[axis] !== ref.max[axis] ||
        Math.abs(h.velocity[axis]) !== Math.abs(ref.velocity[axis]) ||
        !integer(h.offset[axis], -12, Math.max(12, (ref.max[axis] - ref.min[axis]) * 12))
      )
        return null;
  }
  if (!object(s.ball)) return null;
  for (const k of BALL_FIELDS) {
    if (['grounded', 'rubber', 'slide'].includes(k)) {
      if (typeof s.ball[k] !== 'boolean') return null;
    } else if (!integer(s.ball[k], -1e6, 1e6)) return null;
  }
  const b = s.ball;
  if (
    !integer(b.x, 0, level.width * 12 - 1) ||
    !integer(b.y, 0, level.height * 12 - 1) ||
    ![12, 16].includes(Number(b.ballSize)) ||
    Number(b.radius) !== Number(b.ballSize) / 2 ||
    ![12, 16].includes(Number(b.checkpointSize)) ||
    !integer(b.checkpointX, 0, level.width - 1) ||
    !integer(b.checkpointY, 0, level.height - 1) ||
    !integer(b.phase, 0, 2) ||
    !integer(b.popTicks, 0, 7) ||
    !integer(b.input, 0, 15)
  )
    return null;
  for (const k of ['speedTicks', 'gravityTicks', 'jumpTicks'] as const)
    if (!integer(b[k], 0, 300)) return null;
  if ((b.phase === 2 && Number(b.popTicks) === 0) || (b.phase !== 2 && b.popTicks !== 0))
    return null;
  if ((s.mode === 'complete' && level.id === 11) || (s.mode === 'won' && level.id !== 11))
    return null;
  const clean = structuredClone(s);
  clean.ball = Object.fromEntries(BALL_FIELDS.map((key) => [key, b[key]])) as Snapshot['ball'];
  return clean;
}
export function readProgress(storage: Pick<Storage, 'getItem'>): Progress {
  const defaults = { unlocked: 1, highScore: 0, muted: false };
  try {
    const data: unknown = JSON.parse(storage.getItem(KEY) ?? 'null');
    if (!object(data)) return defaults;
    return {
      unlocked: integer(data.unlocked, 1, 11) ? data.unlocked : 1,
      highScore: integer(data.highScore, 0, 1e9) ? data.highScore : 0,
      muted: data.muted === true,
      run: data.run,
    };
  } catch {
    return defaults;
  }
}
export function writeProgress(storage: Pick<Storage, 'setItem'>, value: unknown) {
  try {
    storage.setItem(KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function browserStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem: () => null,
      setItem: () => {
        throw new Error('Storage unavailable');
      },
    };
  }
}
