export interface Note {
  frequency: number;
  duration: number;
  gate: number;
  volume: number;
}
const tempos = [
  25, 28, 31, 35, 40, 45, 50, 56, 63, 70, 80, 90, 100, 112, 125, 140, 160, 180, 200, 225, 250, 285,
  320, 355, 400, 450, 500, 565, 635, 715, 800, 900,
];
/** Nokia Smart Messaging OTA ringtone bitstream, used by the three original cues. */
export function decodeOtt(data: Uint8Array): Note[] {
  let position = 0;
  const read = (count: number) => {
    if (position + count > data.length * 8) throw new Error('Truncated OTT sound');
    let n = 0;
    for (let i = 0; i < count; i++, position++)
      n = (n << 1) | ((data[position >> 3] >> (7 - (position % 8))) & 1);
    return n;
  };
  read(8);
  read(8);
  read(7);
  const type = read(3);
  if (type !== 1 && type !== 2) throw new Error('Unsupported OTT sound');
  const title = read(4);
  for (let i = 0; i < title; i++) read(8);
  const patterns = read(8),
    notes: Note[] = [];
  let scale = 0,
    style = 0,
    bpm = 120,
    volume = 7;
  for (let p = 0; p < patterns; p++) {
    read(3);
    read(2);
    read(4);
    const count = read(8);
    for (let i = 0; i < count; i++) {
      const command = read(3);
      if (command === 0) {
        read(2);
      } else if (command === 1) {
        const tone = read(4),
          length = read(3),
          modifier = read(2);
        if (tone > 12) throw new Error('Invalid OTT note');
        const duration = (((60 / bpm) * 4) / (1 << length)) * [1, 1.5, 1.75, 2 / 3][modifier];
        notes.push({
          frequency: tone ? 261.625565 * Math.pow(2, (tone - 1) / 12 + scale) : 0,
          duration,
          gate: style === 1 ? 1 : style === 2 ? 0.5 : 0.9,
          volume: volume / 15,
        });
      } else if (command === 2) scale = Math.max(0, read(2) - 1);
      else if (command === 3) style = read(2);
      else if (command === 4) bpm = tempos[read(5)];
      else if (command === 5) volume = read(4);
      else throw new Error('Unsupported OTT command');
    }
  }
  return notes;
}
