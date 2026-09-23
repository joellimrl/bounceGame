export const SKY = '#b0e0f0',
  WATER = '#1060b0';
export function canvas(width = 12, height = 12) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}
export function context(c: HTMLCanvasElement) {
  const g = c.getContext('2d');
  if (!g) throw new Error('This browser cannot create a game display.');
  g.imageSmoothingEnabled = false;
  return g;
}
export function transform(source: HTMLCanvasElement, operation: number) {
  const c = canvas(source.width, source.height),
    g = context(c);
  g.translate(c.width / 2, c.height / 2);
  if (operation === 0) g.scale(-1, 1);
  if (operation === 1) g.scale(1, -1);
  if (operation === 2) g.scale(-1, -1);
  if (operation === 3) g.rotate(-Math.PI / 2);
  if (operation === 4) g.rotate(Math.PI);
  if (operation === 5) g.rotate(Math.PI / 2);
  g.drawImage(source, -source.width / 2, -source.height / 2);
  return c;
}
export async function loadImage(url: string) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}
export function createAtlas(ss: HTMLImageElement) {
  const sprites: HTMLCanvasElement[] = [];
  const crop = (source: HTMLImageElement, x: number, y: number, bg?: string) => {
    const c = canvas(),
      g = context(c);
    if (bg) {
      g.fillStyle = bg;
      g.fillRect(0, 0, 12, 12);
    }
    g.drawImage(source, x * 12, y * 12, 12, 12, 0, 0, 12, 12);
    return c;
  };
  const big = (source: HTMLCanvasElement) => {
    const c = canvas(16, 16),
      g = context(c);
    g.drawImage(source, -4, -4);
    g.drawImage(transform(source, 0), 8, -4);
    g.drawImage(transform(source, 1), -4, 8);
    g.drawImage(transform(source, 4), 8, 8);
    return c;
  };
  const exit = (source: HTMLCanvasElement) => {
    const c = canvas(24, 48),
      g = context(c);
    g.fillStyle = SKY;
    g.fillRect(0, 0, 24, 48);
    for (const [x, w, color] of [
      [4, 16, '#fc9d9e'],
      [6, 10, '#e33a3f'],
      [10, 4, '#c2848e'],
    ] as const) {
      g.fillStyle = color;
      g.fillRect(x, 0, w, 48);
    }
    g.drawImage(source, 0, 0);
    g.drawImage(transform(source, 0), 12, 0);
    g.drawImage(transform(source, 1), 0, 12);
    g.drawImage(transform(source, 2), 12, 12);
    return c;
  };
  sprites[0] = crop(ss, 1, 0);
  sprites[1] = crop(ss, 1, 2);
  sprites[2] = crop(ss, 0, 3, SKY);
  sprites[3] = transform(sprites[2], 1);
  sprites[4] = transform(sprites[2], 3);
  sprites[5] = transform(sprites[2], 5);
  sprites[6] = crop(ss, 0, 3, WATER);
  sprites[7] = transform(sprites[6], 1);
  sprites[8] = transform(sprites[6], 3);
  sprites[9] = transform(sprites[6], 5);
  sprites[10] = crop(ss, 0, 4);
  sprites[11] = crop(ss, 3, 4);
  sprites[12] = exit(crop(ss, 2, 3));
  sprites[14] = crop(ss, 0, 5);
  sprites[13] = transform(sprites[14], 1);
  sprites[15] = transform(sprites[13], 0);
  sprites[16] = transform(sprites[14], 0);
  sprites[18] = crop(ss, 1, 5);
  sprites[17] = transform(sprites[18], 1);
  sprites[19] = transform(sprites[17], 0);
  sprites[20] = transform(sprites[18], 0);
  sprites[22] = crop(ss, 2, 5);
  sprites[21] = transform(sprites[22], 1);
  sprites[23] = transform(sprites[21], 0);
  sprites[24] = transform(sprites[22], 0);
  sprites[26] = crop(ss, 3, 5);
  sprites[25] = transform(sprites[26], 1);
  sprites[27] = transform(sprites[25], 0);
  sprites[28] = transform(sprites[26], 0);
  sprites[29] = transform(sprites[14], 5);
  sprites[30] = transform(sprites[29], 1);
  sprites[31] = transform(sprites[29], 0);
  sprites[32] = transform(sprites[30], 0);
  sprites[33] = transform(sprites[18], 5);
  sprites[34] = transform(sprites[33], 1);
  sprites[35] = transform(sprites[33], 0);
  sprites[36] = transform(sprites[34], 0);
  sprites[37] = transform(sprites[22], 5);
  sprites[38] = transform(sprites[37], 1);
  sprites[39] = transform(sprites[37], 0);
  sprites[40] = transform(sprites[38], 0);
  sprites[41] = transform(sprites[26], 5);
  sprites[42] = transform(sprites[41], 1);
  sprites[43] = transform(sprites[41], 0);
  sprites[44] = transform(sprites[42], 0);
  sprites[45] = crop(ss, 3, 3);
  sprites[46] = crop(ss, 1, 3);
  sprites[47] = crop(ss, 2, 0);
  sprites[48] = crop(ss, 0, 1);
  sprites[49] = big(crop(ss, 3, 0));
  sprites[50] = crop(ss, 3, 1);
  sprites[51] = crop(ss, 2, 4);
  sprites[52] = crop(ss, 3, 2);
  sprites[53] = crop(ss, 1, 1);
  sprites[54] = crop(ss, 2, 2);
  sprites[55] = crop(ss, 0, 0, SKY);
  sprites[56] = transform(sprites[55], 3);
  sprites[57] = transform(sprites[55], 4);
  sprites[58] = transform(sprites[55], 5);
  sprites[59] = crop(ss, 0, 0, WATER);
  sprites[60] = transform(sprites[59], 3);
  sprites[61] = transform(sprites[59], 4);
  sprites[62] = transform(sprites[59], 5);
  sprites[63] = crop(ss, 0, 2);
  sprites[64] = transform(sprites[63], 3);
  sprites[65] = transform(sprites[63], 4);
  sprites[66] = transform(sprites[63], 5);
  const life = crop(ss, 2, 1);
  const ring = crop(ss, 1, 4);
  const hazard = canvas(24, 24),
    g = context(hazard);
  g.drawImage(sprites[46], 0, 0);
  g.drawImage(transform(sprites[46], 0), 12, 0);
  g.drawImage(transform(sprites[46], 4), 12, 12);
  g.drawImage(transform(sprites[46], 1), 0, 12);
  return { sprites, life, ring, hazard };
}
export type Atlas = ReturnType<typeof createAtlas>;
