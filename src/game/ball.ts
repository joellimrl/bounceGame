/** Behaviour port of Nokia Bounce's ball logic; see THIRD_PARTY_NOTICES.md.
 * Velocities are tenths of a pixel per 40 ms tick. Integer division and update
 * ordering deliberately follow the reference; browser scheduling lives elsewhere.
 */
import type { GameState } from './simulation';
import { TileIDs } from './tiles';
export class Ball {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  input = 0;
  ballSize = 12;
  radius = 6;
  checkpointX = 0;
  checkpointY = 0;
  checkpointSize = 12;
  phase = 0;
  jumpBoost = 0;
  speedTicks = 0;
  gravityTicks = 0;
  jumpTicks = 0;
  grounded = false;
  rubber = false;
  slide = false;
  slideCounter = 0;
  popTicks = 0;
  world: GameState;
  static readonly SLOPE_COLLISION = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];
  static readonly BALL_COLLISION = [
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
  ];
  static readonly BIG_BALL_COLLISION = [
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  ];
  constructor(paramInt1: number, paramInt2: number, ballSize: number, parame: GameState) {
    this.x = paramInt1;
    this.y = paramInt2;
    this.vx = 0;
    this.vy = 0;
    this.world = parame;
    this.jumpBoost = 0;
    this.grounded = false;
    this.rubber = false;
    this.slide = false;
    this.popTicks = 0;
    this.speedTicks = 0;
    this.gravityTicks = 0;
    this.jumpTicks = 0;
    this.slideCounter = 0;
    this.phase = 0;
    this.input = 0;

    if (ballSize == 12) {
      this.deflate();
    } else {
      this.inflate();
    }
  }
  setCheckpoint(tileX: number, tileY: number): void {
    this.checkpointX = tileX;
    this.checkpointY = tileY;
    this.checkpointSize = this.ballSize;
  }
  pressInput(paramInt: number): void {
    if (paramInt == 8 || paramInt == 4 || paramInt == 2 || paramInt == 1) this.input |= paramInt;
  }
  releaseInput(paramInt: number): void {
    if (paramInt == 8 || paramInt == 4 || paramInt == 2 || paramInt == 1) this.input &= ~paramInt;
  }
  clearInput(): void {
    this.input &= 0xfffffff0;
  }
  canMove(x: number, y: number): boolean {
    let i = Math.trunc((x - this.radius) / 12);
    let j = Math.trunc((y - this.radius) / 12);
    let k = Math.trunc((x - 1 + this.radius) / 12) + 1;
    let m = Math.trunc((y - 1 + this.radius) / 12) + 1;
    for (let tileX = i; tileX < k; tileX++) {
      for (let tileY = j; tileY < m; tileY++) {
        if (!this.collideTile(x, y, tileY, tileX)) return false;
      }
    }
    return true;
  }
  inflate(): void {
    this.ballSize = 16;
    this.radius = 8;

    // Try to solve any collisions with the world
    let placed = false;
    for (let offset = 1; !placed && offset <= 48; offset++) {
      placed = true;
      if (this.canMove(this.x, this.y - offset)) {
        this.y -= offset;
        continue;
      }
      if (this.canMove(this.x - offset, this.y - offset)) {
        this.x -= offset;
        this.y -= offset;
        continue;
      }
      if (this.canMove(this.x + offset, this.y - offset)) {
        this.x += offset;
        this.y -= offset;
        continue;
      }
      if (this.canMove(this.x, this.y + offset)) {
        this.y += offset;
        continue;
      }
      if (this.canMove(this.x - offset, this.y + offset)) {
        this.x -= offset;
        this.y += offset;
        continue;
      }
      if (this.canMove(this.x + offset, this.y + offset)) {
        this.x += offset;
        this.y += offset;
        continue;
      }
      placed = false;
    }
    if (!placed) this.deflate();
  }
  deflate(): void {
    this.ballSize = 12;
    this.radius = 6;
  }
  pop(): void {
    if (!this.world.invincible && this.phase === 0) {
      this.popTicks = 7;
      this.phase = 2;
      this.world.lives--;
      this.speedTicks = 0;
      this.gravityTicks = 0;
      this.jumpTicks = 0;

      this.world.sounds.pop.play(1);
    }
  }
  collectRing(): void {
    this.world.addScore(500);
    this.world.rings++;
  }
  deflectSlope(paramInt: number): void {
    let i = this.vx;
    switch (paramInt) {
      case 35: {
        this.vx = this.vx > -this.vy ? this.vx : this.vy;
        this.vy = i;
        break;
      }
      case 37: {
        this.vx = -this.vx > this.vy ? this.vx : this.vy;
        this.vy = i;
        break;
      }
      case 34: {
        this.vx = this.vx < this.vy ? this.vx : -this.vy;
        this.vy = -i;
        break;
      }
      case 36: {
        this.vx = this.vx > this.vy ? this.vx : -this.vy;
        this.vy = -i;
        break;
      }
      case 31: {
        this.vx = this.vx > -this.vy ? this.vx : this.vy >> 1;
        this.vy = i;
        break;
      }
      case 33: {
        this.vx = -this.vx > this.vy ? this.vx : this.vy >> 1;
        this.vy = i;
        break;
      }
      case 30: {
        this.vx = this.vx < this.vy ? this.vx : -(this.vy >> 1);
        this.vy = -i;
        break;
      }
      case 32: {
        this.vx = this.vx > this.vy ? this.vx : -(this.vy >> 1);
        this.vy = -i;
        break;
      }
    }
  }
  hitsWall(paramInt1: number, paramInt2: number, tileY: number, tileX: number): boolean {
    let b1;
    let n;
    let b2;
    let i1;
    let ballCollision: number[][];
    let i = tileX * 12;
    let j = tileY * 12;
    let k = paramInt1 - this.radius - i;
    let m = paramInt2 - this.radius - j;
    if (k >= 0) {
      b1 = k;
      n = 12;
    } else {
      b1 = 0;
      n = this.ballSize + k;
    }
    if (m >= 0) {
      b2 = m;
      i1 = 12;
    } else {
      b2 = 0;
      i1 = this.ballSize + m;
    }
    if (this.ballSize == 16) {
      ballCollision = Ball.BIG_BALL_COLLISION;
    } else {
      ballCollision = Ball.BALL_COLLISION;
    }
    if (n > 12) n = 12;
    if (i1 > 12) i1 = 12;
    for (let b3 = b1; b3 < n; b3++) {
      for (let b = b2; b < i1; b++) {
        if (ballCollision[b - m][b3 - k] != 0) return true;
      }
    }
    return false;
  }
  hitsSlope(paramInt1: number, paramInt2: number, y: number, x: number, tileId: number): boolean {
    let b3;
    let n;
    let b4;
    let i1;
    let ballCollision: number[][];
    let i = x * 12;
    let j = y * 12;
    let k = paramInt1 - this.radius - i;
    let m = paramInt2 - this.radius - j;
    let b1 = 0;
    let b2 = 0;
    switch (tileId) {
      case 30:
      case 34: {
        b2 = 11;
        b1 = 11;
        break;
      }
      case 31:
      case 35:
        b2 = 11;
        break;
      case 33:
      case 37:
        b1 = 11;
        break;
    }
    if (k >= 0) {
      b3 = k;
      n = 12;
    } else {
      b3 = 0;
      n = this.ballSize + k;
    }
    if (m >= 0) {
      b4 = m;
      i1 = 12;
    } else {
      b4 = 0;
      i1 = this.ballSize + m;
    }
    if (this.ballSize == 16) {
      ballCollision = Ball.BIG_BALL_COLLISION;
    } else {
      ballCollision = Ball.BALL_COLLISION;
    }
    if (n > 12) n = 12;
    if (i1 > 12) i1 = 12;
    for (let b5 = b3; b5 < n; b5++) {
      for (let b = b4; b < i1; b++) {
        if (
          (Ball.SLOPE_COLLISION[Math.abs(b - b2)][Math.abs(b5 - b1)] &
            ballCollision[b - m][b5 - k]) !=
          0
        ) {
          if (!this.grounded) this.deflectSlope(tileId);
          return true;
        }
      }
    }
    return false;
  }
  hitsObject(
    paramInt1: number,
    paramInt2: number,
    tileY: number,
    tileX: number,
    tileId: number,
  ): boolean {
    let i = tileX * 12;
    let j = tileY * 12;
    let k = i + 12;
    let m = j + 12;
    switch (tileId) {
      case TileIDs.THORNS_UP:
      case TileIDs.THORNS_DOWN:
      case 9:
      case 13:
      case 14:
      case 17:
      case 18:
      case 21:
      case 22:
      case 43:
      case 45: {
        i += 4;
        k -= 4;
        break;
      }
      case TileIDs.THORNS_RIGHT:
      case TileIDs.THORNS_LEFT:
      case 15:
      case 16:
      case 19:
      case 20:
      case 23:
      case 24:
      case 44:
      case 46: {
        j += 4;
        m -= 4;
        break;
      }
    }
    return Ball.overlaps(
      paramInt1 - this.radius,
      paramInt2 - this.radius,
      paramInt1 + this.radius - 1,
      paramInt2 + this.radius - 1,
      i,
      j,
      k - 1,
      m - 1,
    );
  }
  hitsRim(
    paramInt1: number,
    paramInt2: number,
    paramInt3: number,
    paramInt4: number,
    paramInt5: number,
  ): boolean {
    let i = paramInt4 * 12;
    let j = paramInt3 * 12;
    let k = i + 12;
    let m = j + 12;
    switch (paramInt5) {
      case 15:
      case 19:
      case 23:
      case 27: {
        j += 6;
        m -= 6;
        k -= 11;
        break;
      }
      case 16:
      case 20:
      case 24:
      case 28: {
        j += 6;
        m -= 6;
        i += 11;
        break;
      }
      case 13:
      case 17: {
        i += 6;
        k -= 6;
        m -= 11;
        break;
      }
      case 21:
      case 25: {
        m = j;
        j--;
        i += 6;
        k -= 6;
        break;
      }
      case 14:
      case 18:
      case 22:
      case 26: {
        i += 6;
        k -= 6;
        j += 11;
        break;
      }
    }
    return Ball.overlaps(
      paramInt1 - this.radius,
      paramInt2 - this.radius,
      paramInt1 + this.radius,
      paramInt2 + this.radius,
      i,
      j,
      k,
      m,
    );
  }
  collideTile(x: number, y: number, tileY: number, tileX: number): boolean {
    let k;
    if (
      tileY >= this.world.level.height ||
      tileY < 0 ||
      tileX >= this.world.level.width ||
      tileX < 0
    )
      return false;
    if (this.phase == 2) return false;
    let bool = true;
    let isInWater = this.world.tiles[tileY][tileX] & 0x40;
    let tileId = this.world.tiles[tileY][tileX] & ~0x40 & ~0x80;
    let sound: { play(n: number): void } | null = null;
    switch (tileId) {
      case TileIDs.BRICK_WALL: {
        if (this.hitsWall(x, y, tileY, tileX)) {
          bool = false;
          this.slide = true;
          break;
        }
        this.slide = true;
        break;
      }
      case TileIDs.RUBBER_WALL: {
        if (this.hitsWall(x, y, tileY, tileX)) {
          this.rubber = true;
          bool = false;
          break;
        }
        this.slide = true;
        break;
      }
      case 34:
      case 35:
      case 36:
      case 37: {
        if (this.hitsSlope(x, y, tileY, tileX, tileId)) {
          this.rubber = true;
          bool = false;
          this.slide = true;
        }
        break;
      }
      case 30:
      case 31:
      case 32:
      case 33: {
        if (this.hitsSlope(x, y, tileY, tileX, tileId)) {
          bool = false;
          this.slide = true;
        }
        break;
      }
      case 10: {
        k = this.world.findHazard(tileX, tileY);
        if (k != -1) {
          let m = this.world.hazards[k].min.x * 12 + this.world.hazards[k].offset.x;
          let n = this.world.hazards[k].min.y * 12 + this.world.hazards[k].offset.y;
          if (
            Ball.overlaps(
              x - this.radius + 1,
              y - this.radius + 1,
              x + this.radius - 1,
              y + this.radius - 1,
              m + 1,
              n + 1,
              m + 24 - 1,
              n + 24 - 1,
            )
          ) {
            bool = false;
            this.pop();
          }
        }
        break;
      }
      case TileIDs.THORNS_UP:
      case TileIDs.THORNS_RIGHT:
      case TileIDs.THORNS_DOWN:
      case TileIDs.THORNS_LEFT: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          bool = false;
          this.pop();
        }
        break;
      }
      case TileIDs.CRYSTAL: {
        this.world.addScore(200);
        this.world.tiles[this.checkpointY][this.checkpointX] = 0x80 | TileIDs.EMPTY;
        this.setCheckpoint(tileX, tileY);
        this.world.tiles[tileY][tileX] = 0x80 | TileIDs.CRYSTAL_ACTIVE;
        sound = this.world.sounds.pickup;
        break;
      }
      case 23: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          if (this.hitsRim(x, y, tileY, tileX, tileId)) {
            bool = false;
            break;
          }
          this.collectRing();
          this.world.tiles[tileY][tileX] = 0x80 | 27 | isInWater;
          this.world.tiles[tileY][tileX + 1] = 0x80 | 28 | isInWater;
          sound = this.world.sounds.up;
        }
        break;
      }
      case 15: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          if (this.ballSize == 16) {
            bool = false;
            break;
          }
          if (this.hitsRim(x, y, tileY, tileX, tileId)) bool = false;
          this.collectRing();
          this.world.tiles[tileY][tileX] = 0x93 | isInWater;
          this.world.tiles[tileY][tileX + 1] = 0x94 | isInWater;
          sound = this.world.sounds.up;
        }
        break;
      }
      case 24: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          if (this.hitsRim(x, y, tileY, tileX, tileId)) bool = false;
          this.collectRing();
          this.world.tiles[tileY][tileX] = 0x9c | isInWater;
          this.world.tiles[tileY][tileX - 1] = 0x9b | isInWater;
          sound = this.world.sounds.up;
        }
        break;
      }
      case 16: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          if (this.ballSize == 16) {
            bool = false;
            break;
          }
          if (this.hitsRim(x, y, tileY, tileX, tileId)) bool = false;
          this.collectRing();
          this.world.tiles[tileY][tileX] = 0x94 | isInWater;
          this.world.tiles[tileY][tileX - 1] = 0x93 | isInWater;
          sound = this.world.sounds.up;
        }
        break;
      }
      case 21: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          if (this.hitsRim(x, y, tileY, tileX, tileId)) bool = false;
          this.collectRing();
          this.world.tiles[tileY][tileX] = 0x99 | isInWater;
          this.world.tiles[tileY + 1][tileX] = 0x9a | isInWater;
          sound = this.world.sounds.up;
        }
        break;
      }
      case 13: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          if (this.ballSize == 16) {
            bool = false;
            break;
          }
          if (this.hitsRim(x, y, tileY, tileX, tileId)) bool = false;
          this.collectRing();
          this.world.tiles[tileY][tileX] = 0x91 | isInWater;
          this.world.tiles[tileY + 1][tileX] = 0x92 | isInWater;
          sound = this.world.sounds.up;
        }
        break;
      }
      case 22: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          this.collectRing();
          this.world.tiles[tileY][tileX] = 0x9a | isInWater;
          this.world.tiles[tileY - 1][tileX] = 0x99 | isInWater;
          sound = this.world.sounds.up;
        }
        break;
      }
      case 14: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          if (this.ballSize == 16) {
            bool = false;
            break;
          }
          this.collectRing();
          this.world.tiles[tileY][tileX] = 0x92 | isInWater;
          this.world.tiles[tileY - 1][tileX] = 0x91 | isInWater;
          sound = this.world.sounds.up;
        }
        break;
      }
      case 17:
      case 19:
      case 20: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          if (this.ballSize == 16) {
            bool = false;
            break;
          }
          if (this.hitsRim(x, y, tileY, tileX, tileId)) bool = false;
        }
        break;
      }
      case 25:
      case 27:
      case 28: {
        if (this.hitsRim(x, y, tileY, tileX, tileId)) bool = false;
        break;
      }
      case 18: {
        if (this.hitsObject(x, y, tileY, tileX, tileId) && this.ballSize == 16) bool = false;
        break;
      }
      case 9: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          if (this.world.exitOpen) {
            this.world.exiting = true;
            sound = this.world.sounds.pickup;
            break;
          }
          bool = false;
        }
        break;
      }
      case 29: {
        // Power up
        this.world.addScore(1000);
        if (this.world.lives < 5) {
          this.world.lives++;
        }
        this.world.tiles[tileY][tileX] = 0x80 | TileIDs.EMPTY;
        sound = this.world.sounds.pickup;
        break;
      }
      case 39:
      case 40:
      case 41:
      case 42: {
        bool = false;
        if (this.ballSize == 16) this.deflate();
        break;
      }
      case TileIDs.PUMPER_UP:
      case TileIDs.PUMPER_RIGHT:
      case TileIDs.PUMPER_DOWN:
      case TileIDs.PUMPER_LEFT: {
        if (this.hitsObject(x, y, tileY, tileX, tileId)) {
          bool = false;
          if (this.ballSize == 12) this.inflate();
        }
        break;
      }
      case TileIDs.POWER_UP_GRAVITY_UP:
      case TileIDs.POWER_UP_GRAVITY_RIGHT:
      case TileIDs.POWER_UP_GRAVITY_DOWN:
      case TileIDs.POWER_UP_GRAVITY_LEFT: {
        this.gravityTicks = 300;
        sound = this.world.sounds.pickup;
        this.grounded = false;
        bool = false;
        break;
      }
      case 51:
      case 52:
      case 53:
      case 54: {
        this.jumpTicks = 300;
        sound = this.world.sounds.pickup;
        bool = false;
        break;
      }
      case 38: {
        this.speedTicks = 300;
        sound = this.world.sounds.pickup;
        bool = false;
        break;
      }
    }
    if (sound != null) sound.play(1);
    return bool;
  }
  update(): void {
    let i = this.x;
    let j = 0;
    let k = 0;
    let b1 = 0;
    let bool1 = false;
    if (this.phase == 2) {
      this.popTicks--;
      if (this.popTicks == 0) {
        this.phase = 1;
        if (this.world.lives < 0) this.world.exiting = true;
      }
      return;
    }
    let tileX = Math.trunc(this.x / 12);
    let tileY = Math.trunc(this.y / 12);
    let isInWater = (this.world.tiles[tileY][tileX] & 0x40) != 0;
    if (isInWater) {
      if (this.ballSize == 16) {
        k = -30;
        j = -2;
        if (this.grounded) this.vy = -10;
      } else {
        k = 42;
        j = 6;
      }
    } else if (this.ballSize == 16) {
      k = 38;
      j = 3;
    } else {
      k = 80;
      j = 4;
    }
    if (this.gravityTicks != 0) {
      bool1 = true;
      k *= -1;
      j *= -1;
      this.gravityTicks--;
      if (this.gravityTicks == 0) {
        bool1 = false;
        this.grounded = false;
        k *= -1;
        j *= -1;
      }
    }
    if (this.jumpTicks != 0) {
      if (-1 * Math.abs(this.jumpBoost) > -80)
        if (bool1) {
          this.jumpBoost = 80;
        } else {
          this.jumpBoost = -80;
        }
      this.jumpTicks--;
    }
    this.slideCounter++;
    if (this.slideCounter == 3) this.slideCounter = 0;
    if (this.vy < -150) {
      this.vy = -150;
    } else if (this.vy > 150) {
      this.vy = 150;
    }
    if (this.vx < -150) {
      this.vx = -150;
    } else if (this.vx > 150) {
      this.vx = 150;
    }
    if (this.vy < 10 && this.vy > 0 && !isInWater && !bool1) this.vy = 10;
    for (let b2 = 0; b2 < Math.trunc(Math.abs(this.vy) / 10); b2++) {
      let b = 0;
      if (this.vy != 0) b = this.vy < 0 ? -1 : 1;
      if (this.canMove(this.x, this.y + b)) {
        this.y += b;
        this.grounded = false;
        if (k == -30) {
          tileY = Math.trunc(this.y / 12);
          if ((this.world.tiles[tileY][tileX] & 0x40) == 0) {
            this.vy >>= 1;
            if (this.vy <= 10 && this.vy >= -10) this.vy = 0;
          }
        }
      } else {
        if (this.slide && this.vx < 10 && this.slideCounter == 0) {
          let b4 = 1;
          if (this.canMove(this.x + b4, this.y + b)) {
            this.x += b4;
            this.y += b;
            this.slide = false;
          } else if (this.canMove(this.x - b4, this.y + b)) {
            this.x -= b4;
            this.y += b;
            this.slide = false;
          }
        }
        if (b > 0 || (bool1 && b < 0)) {
          this.vy = Math.trunc((this.vy * -1) / 2);
          this.grounded = true;
          if (this.rubber && (this.input & 0x8) != 0) {
            this.rubber = false;
            if (bool1) {
              this.jumpBoost += 10;
            } else {
              this.jumpBoost += -10;
            }
          } else if (this.jumpTicks == 0) {
            this.jumpBoost = 0;
          }
          if (this.vy < 10 && this.vy > -10) {
            if (bool1) {
              this.vy = -10;
              break;
            }
            this.vy = 10;
          }
          break;
        }
        if (b < 0 || (bool1 && b > 0))
          if (bool1) {
            this.vy = -20;
          } else {
            this.vy = -this.vy >> 1;
          }
      }
    }
    if (bool1) {
      if (j == -2 && this.vy < k) {
        this.vy += j;
        if (this.vy > k) this.vy = k;
      } else if (!this.grounded && this.vy > k) {
        this.vy += j;
        if (this.vy < k) this.vy = k;
      }
    } else if (j == -2 && this.vy > k) {
      this.vy += j;
      if (this.vy < k) this.vy = k;
    } else if (!this.grounded && this.vy < k) {
      this.vy += j;
      if (this.vy > k) this.vy = k;
    }
    if (this.speedTicks != 0) {
      b1 = 100;
      this.speedTicks--;
    } else {
      b1 = 50;
    }
    if ((this.input & 0x2) != 0 && this.vx < b1) {
      this.vx += 6;
    } else if ((this.input & 0x1) != 0 && this.vx > -b1) {
      this.vx -= 6;
    } else if (this.vx > 0) {
      this.vx -= 4;
    } else if (this.vx < 0) {
      this.vx += 4;
    }
    if (this.ballSize == 16 && this.jumpTicks == 0)
      if (bool1) {
        this.jumpBoost += 5;
      } else {
        this.jumpBoost += -5;
      }
    if (this.grounded && (this.input & 0x8) != 0) {
      if (bool1) {
        this.vy = 67 + this.jumpBoost;
      } else {
        this.vy = -67 + this.jumpBoost;
      }
      this.grounded = false;
    }
    let i1 = Math.abs(this.vx);
    let i2 = Math.trunc(i1 / 10);
    for (let b3 = 0; b3 < i2; b3++) {
      let b = 0;
      if (this.vx != 0) b = this.vx < 0 ? -1 : 1;
      if (this.canMove(this.x + b, this.y)) {
        this.x += b;
      } else if (this.slide) {
        this.slide = false;
        let b4 = 0;
        if (bool1) {
          b4 = 1;
        } else {
          b4 = -1;
        }
        if (this.canMove(this.x + b, this.y + b4)) {
          this.x += b;
          this.y += b4;
        } else if (this.canMove(this.x + b, this.y - b4)) {
          this.x += b;
          this.y -= b4;
        } else {
          this.vx = -(this.vx >> 1);
        }
      }
    }
  }
  static overlaps(
    paramInt1: number,
    paramInt2: number,
    paramInt3: number,
    paramInt4: number,
    paramInt5: number,
    paramInt6: number,
    paramInt7: number,
    paramInt8: number,
  ): boolean {
    return (
      paramInt1 <= paramInt7 &&
      paramInt2 <= paramInt8 &&
      paramInt5 <= paramInt3 &&
      paramInt6 <= paramInt4
    );
  }
}
