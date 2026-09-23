export interface Point {
  x: number;
  y: number;
}
export interface Hazard {
  min: Point;
  max: Point;
  velocity: Point;
  offset: Point;
}
export interface LevelDefinition {
  id: number;
  width: number;
  height: number;
  totalRings: number;
  spawn: Point & { diameter: 12 | 16 };
  exit: Point;
  tiles: number[][];
  hazards: Hazard[];
}
export interface InputFrame {
  left: boolean;
  right: boolean;
  jump: boolean;
}
export const IDLE: InputFrame = { left: false, right: false, jump: false };
export type SoundCue = 'pickup' | 'pop' | 'up';
export type Mode = 'playing' | 'paused' | 'complete' | 'gameover' | 'won';
