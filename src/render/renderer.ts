import type { GameState } from '../game/simulation';
import { context, SKY, WATER, transform, type Atlas } from './atlas';
const back = [35, 36, 17, 19, 43, 44, 25, 27, 31, 32, 13, 15, 39, 40, 21, 23];
const front = [33, 34, 18, 20, 41, 42, 26, 28, 29, 30, 14, 16, 37, 38, 22, 24];
const digits = [
  '111101101101111',
  '010110010010111',
  '111001111100111',
  '111001111001111',
  '101101111001001',
  '111100111001111',
  '111100111101111',
  '111001010010010',
  '111101111101111',
  '111101111001111',
];
export class Renderer {
  private g: CanvasRenderingContext2D;
  private oriented = new Map<string, HTMLCanvasElement>();
  constructor(
    private target: HTMLCanvasElement,
    private atlas: Atlas,
  ) {
    this.g = context(target);
  }
  splash(image: HTMLImageElement) {
    this.g.fillStyle = '#000';
    this.g.fillRect(0, 0, 128, 128);
    this.g.drawImage(image, (128 - image.width) / 2, (128 - image.height) / 2);
  }
  private sprite(id: number, x: number, y: number, rotation = 0) {
    let image = this.atlas.sprites[id];
    if (rotation) {
      const key = `${id}:${rotation}`;
      if (!this.oriented.has(key)) this.oriented.set(key, transform(image, rotation));
      image = this.oriented.get(key)!;
    }
    this.g.drawImage(image, x, y);
  }
  private number(value: number, x: number, y: number, padding = 0) {
    const text = String(Math.max(0, value)).padStart(padding, '0');
    this.g.fillStyle = '#fffffe';
    [...text].forEach((n, i) => {
      [...digits[Number(n)]].forEach((v, j) => {
        if (v === '1') this.g.fillRect(x + i * 4 + (j % 3), y + Math.floor(j / 3), 1, 1);
      });
    });
  }
  render(s: GameState) {
    const g = this.g,
      b = s.ball;
    g.save();
    g.beginPath();
    g.rect(0, 0, 128, 96);
    g.clip();
    g.fillStyle = SKY;
    g.fillRect(0, 0, 128, 96);
    const rings: { id: number; x: number; y: number }[] = [];
    for (let ty = Math.floor(s.cameraY / 12); ty < Math.ceil((s.cameraY + 96) / 12); ty++)
      for (let tx = Math.floor(s.cameraX / 12); tx < Math.ceil((s.cameraX + 128) / 12); tx++) {
        const raw = s.tiles[ty]?.[tx] ?? 1,
          id = raw & 63,
          water = (raw & 64) !== 0,
          x = tx * 12 - s.cameraX,
          y = ty * 12 - s.cameraY;
        g.fillStyle = water ? WATER : SKY;
        g.fillRect(x, y, 12, 12);
        if (id === 1 || id === 2) this.sprite(id === 1 ? 0 : 1, x, y);
        else if (id >= 3 && id <= 6) this.sprite((water ? 6 : 2) + [0, 3, 1, 2][id - 3], x, y);
        else if (id === 7 || id === 8) this.sprite(id === 7 ? 10 : 11, x, y);
        else if (id >= 13 && id <= 28) {
          this.sprite(back[id - 13], x, y);
          this.sprite(front[id - 13], x, y);
          rings.push({ id, x, y });
        } else if (id === 29) this.sprite(45, x, y);
        else if (id >= 30 && id <= 33) this.sprite((water ? 59 : 55) + [2, 1, 0, 3][id - 30], x, y);
        else if (id >= 34 && id <= 37) this.sprite(63 + [2, 1, 0, 3][id - 34], x, y);
        else if (id === 38) this.sprite(53, x, y);
        else if (id >= 39 && id <= 54) {
          const group = Math.floor((id - 39) / 4);
          this.sprite([50, 51, 52, 54][group], x, y, [0, 5, 4, 3][(id - 39) % 4]);
        } else if (id === 9) {
          const ex = s.level.exit.x * 12 - s.cameraX,
            ey = s.level.exit.y * 12 - s.cameraY;
          g.save();
          g.beginPath();
          g.rect(x, y, 12, 12);
          g.clip();
          g.drawImage(this.atlas.sprites[12], 0, s.exitFrame, 24, 24, ex, ey, 24, 24);
          g.restore();
        }
      }
    for (const h of s.hazards)
      g.drawImage(
        this.atlas.hazard,
        h.min.x * 12 + h.offset.x - s.cameraX,
        h.min.y * 12 + h.offset.y - s.cameraY,
      );
    const size = b.phase === 2 ? 12 : b.ballSize;
    this.sprite(
      b.phase === 2 ? 48 : b.ballSize === 16 ? 49 : 47,
      b.x - size / 2 - s.cameraX,
      b.y - size / 2 - s.cameraY,
    );
    for (const r of rings) this.sprite(front[r.id - 13], r.x, r.y);
    g.restore();
    g.fillStyle = '#0853aa';
    g.fillRect(0, 96, 128, 32);
    g.fillStyle = '#003c88';
    g.fillRect(0, 96, 128, 1);
    for (let i = 0; i < s.lives; i++) g.drawImage(this.atlas.life, 5 + i * 11, 99);
    for (let i = 0; i < s.level.totalRings - s.rings; i++)
      g.drawImage(this.atlas.ring, 5 + i * 8, 112);
    this.number(s.score, 65, 101, 7);
    const boost = Math.max(b.speedTicks, b.gravityTicks, b.jumpTicks);
    if (boost) {
      g.fillStyle = '#ff9813';
      g.fillRect(1, 128 - Math.ceil(boost / 10), 3, Math.ceil(boost / 10));
    }
  }
}
