export type UpdateFn = (dt: number) => void
export type RenderFn = () => void

export class GameLoop {
  private rafId = 0
  private lastTime = 0
  private running = false
  private paused = false
  private updateFn: UpdateFn
  private renderFn: RenderFn

  constructor(update: UpdateFn, render: RenderFn) {
    this.updateFn = update
    this.renderFn = render
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.tick(this.lastTime)
  }

  stop() {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  pause() {
    this.paused = true
  }

  resume() {
    this.paused = false
    this.lastTime = performance.now()
  }

  get isPaused() {
    return this.paused
  }

  private tick = (now: number) => {
    if (!this.running) return
    this.rafId = requestAnimationFrame(this.tick)

    if (this.paused) return

    // Cap delta to avoid spiral of death after tab switch
    const dt = Math.min((now - this.lastTime) / 16.667, 3)
    this.lastTime = now

    this.updateFn(dt)
    this.renderFn()
  }
}
