export const TICK_MS = 40;
export class GameClock {
  private remainder = 0;
  advance(ms: number): number {
    if (!Number.isFinite(ms) || ms < 0 || ms > 240) {
      this.reset();
      return 0;
    }
    this.remainder += ms;
    const ticks = Math.floor((this.remainder + 1e-8) / TICK_MS);
    this.remainder = Math.max(0, this.remainder - ticks * TICK_MS);
    return ticks;
  }
  reset() {
    this.remainder = 0;
  }
}
