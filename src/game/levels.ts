import type { LevelDefinition, Hazard } from './model';
/** Original J2ME format: 8-byte header, tile bytes, count, 8-byte hazard records. */
export function decodeLevel(bytes: Uint8Array, id: number): LevelDefinition {
  let offset = 0;
  const fail = (message: string): never => {
    throw new Error(`Level ${id}, offset ${offset}: ${message}`);
  };
  const read = () => (offset < bytes.length ? bytes[offset++] : fail('truncated data'));
  const x = read(),
    y = read(),
    size = read(),
    exit = { x: read(), y: read() };
  const totalRings = read(),
    width = read(),
    height = read();
  if (!width || !height || size > 1 || x >= width || y >= height)
    fail('invalid spawn or dimensions');
  if (exit.x + 1 >= width || exit.y + 1 >= height) fail('invalid exit');
  const tiles = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => {
      const tile = read();
      if ((tile & 63) > 54) fail(`unknown tile ${tile}`);
      return tile;
    }),
  );
  const count = read();
  const hazards: Hazard[] = Array.from({ length: count }, () => {
    const min = { x: read(), y: read() },
      max = { x: read(), y: read() };
    const signed = () => (read() << 24) >> 24;
    const velocity = { x: signed(), y: signed() },
      offset = { x: read(), y: read() };
    if (
      min.x < 0 ||
      min.y < 0 ||
      max.x > width ||
      max.y > height ||
      max.x <= min.x ||
      max.y <= min.y
    )
      fail('invalid hazard bounds');
    return { min, max, velocity, offset };
  });
  if (offset !== bytes.length) fail('unexpected trailing data');
  const rings = tiles.flat().filter((tile) => [13, 15, 21, 23].includes(tile & 63)).length;
  if (rings !== totalRings) fail('ring count mismatch');
  return {
    id,
    width,
    height,
    totalRings,
    spawn: { x, y, diameter: size ? 16 : 12 },
    exit,
    tiles,
    hazards,
  };
}
