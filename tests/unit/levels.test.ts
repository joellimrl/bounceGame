import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { decodeLevel } from '../../src/game/levels';
const inventory = [
  [112, 8, 6, 12, 0],
  [134, 22, 8, 12, 6],
  [134, 36, 9, 16, 11],
  [134, 29, 7, 12, 11],
  [90, 43, 10, 16, 0],
  [112, 36, 8, 12, 4],
  [134, 36, 11, 12, 12],
  [156, 36, 11, 12, 11],
  [222, 36, 12, 12, 4],
  [112, 35, 12, 12, 7],
  [178, 57, 15, 16, 5],
];
export const bytes = (n: number) =>
  new Uint8Array(readFileSync(`public/levels/J2MElvl.${String(n).padStart(3, '0')}`));
describe('original binary levels', () => {
  it.each(inventory.map((row, i) => [i + 1, row] as const))(
    'decodes level %i without losing tiles or hazards',
    (id, row) => {
      const level = decodeLevel(bytes(id), id);
      expect([
        level.width,
        level.height,
        level.totalRings,
        level.spawn.diameter,
        level.hazards.length,
      ]).toEqual(row);
      expect(level.tiles.flat()).toHaveLength(row[0] * row[1]);
      expect(
        level.tiles.flat().filter((v: number) => [13, 15, 21, 23].includes(v & 63)),
      ).toHaveLength(row[2]);
    },
  );
  it('preserves boundary exit and large spawn in final level', () => {
    const l = decodeLevel(bytes(11), 11);
    expect(l.spawn).toEqual({ x: 142, y: 37, diameter: 16 });
    expect(l.exit).toEqual({ x: 0, y: 47 });
  });
  it('rejects truncated hazard data', () =>
    expect(() => decodeLevel(bytes(2).slice(0, -1), 2)).toThrow(/offset|truncated/i));
  it('rejects unknown tile ids', () => {
    const b = bytes(1);
    b[8] = 63;
    expect(() => decodeLevel(b, 1)).toThrow(/tile/i);
  });
  it('rejects invalid spawn coordinates', () => {
    const b = bytes(1);
    b[0] = 255;
    expect(() => decodeLevel(b, 1)).toThrow(/spawn/i);
  });
});
