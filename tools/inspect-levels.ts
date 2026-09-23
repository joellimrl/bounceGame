import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { decodeLevel } from '../src/game/levels';
for (let id = 1; id <= 11; id++) {
  const bytes = readFileSync(`public/levels/J2MElvl.${String(id).padStart(3, '0')}`);
  const level = decodeLevel(bytes, id);
  console.log(
    JSON.stringify({
      level: id,
      width: level.width,
      height: level.height,
      rings: level.totalRings,
      spawn: level.spawn,
      exit: level.exit,
      hazards: level.hazards.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    }),
  );
}
