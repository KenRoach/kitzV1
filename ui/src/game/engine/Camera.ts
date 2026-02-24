import { CANVAS_WIDTH } from '../constants'

export class Camera {
  x = 0
  y = 0

  private leadX = CANVAS_WIDTH * 0.35
  private smoothing = 0.08

  levelWidth = CANVAS_WIDTH

  update(playerX: number, _playerY: number) {
    const targetX = playerX - this.leadX
    this.x += (targetX - this.x) * this.smoothing
    this.x = Math.max(0, Math.min(this.x, this.levelWidth - CANVAS_WIDTH))
    this.y = 0
  }
}
