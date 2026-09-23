import type { SoundCue } from '../game/model';
import { decodeOtt, type Note } from './ott';
export class GameAudio {
  muted = false;
  private audio?: AudioContext;
  private notes: Partial<Record<SoundCue, Note[]>> = {};
  private playing: OscillatorNode[] = [];
  async load(base: string) {
    await Promise.all(
      (['pickup', 'pop', 'up'] as const).map(async (cue) => {
        try {
          const r = await fetch(`${base}${cue}.ott`);
          if (r.ok) this.notes[cue] = decodeOtt(new Uint8Array(await r.arrayBuffer()));
        } catch {
          /* Silent play remains available. */
        }
      }),
    );
  }
  unlock() {
    if (this.muted) return;
    try {
      this.audio ??= new AudioContext();
      void this.audio.resume().catch(() => {});
    } catch {
      /* Audio support is optional. */
    }
  }
  stop() {
    for (const node of this.playing) {
      try {
        node.stop();
      } catch {}
    }
    this.playing = [];
  }
  play(cue: SoundCue) {
    if (this.muted || !this.audio || this.audio.state !== 'running') return;
    const ctx = this.audio;
    this.stop();
    let time = ctx.currentTime;
    for (const note of this.notes[cue] ?? []) {
      if (note.frequency) {
        const tone = ctx.createOscillator(),
          gain = ctx.createGain();
        tone.type = 'square';
        tone.frequency.value = note.frequency;
        tone.connect(gain);
        gain.connect(ctx.destination);
        const end = time + note.duration * note.gate;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(note.volume * 0.07, time + 0.002);
        gain.gain.setValueAtTime(note.volume * 0.07, Math.max(time + 0.002, end - 0.005));
        gain.gain.linearRampToValueAtTime(0, end);
        tone.start(time);
        tone.stop(time + note.duration);
        tone.onended = () => {
          tone.disconnect();
          gain.disconnect();
        };
        this.playing.push(tone);
      }
      time += note.duration;
    }
  }
}
