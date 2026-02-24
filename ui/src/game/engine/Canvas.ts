import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants'

export class Canvas {
  readonly el: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  private scaleX = 1
  private scaleY = 1

  constructor(canvas: HTMLCanvasElement) {
    this.el = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not supported')
    this.ctx = ctx
    ctx.imageSmoothingEnabled = false
    this.resize()
  }

  resize() {
    const parent = this.el.parentElement
    if (!parent) return

    const w = parent.clientWidth
    const h = parent.clientHeight

    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT
    let drawW = w
    let drawH = w / aspect
    if (drawH > h) {
      drawH = h
      drawW = h * aspect
    }

    this.el.width = CANVAS_WIDTH
    this.el.height = CANVAS_HEIGHT
    this.el.style.width = `${drawW}px`
    this.el.style.height = `${drawH}px`

    this.scaleX = CANVAS_WIDTH / drawW
    this.scaleY = CANVAS_HEIGHT / drawH

    this.ctx.imageSmoothingEnabled = false
  }

  toGameCoords(screenX: number, screenY: number): { x: number; y: number } {
    const rect = this.el.getBoundingClientRect()
    return {
      x: (screenX - rect.left) * this.scaleX,
      y: (screenY - rect.top) * this.scaleY,
    }
  }

  clear() {
    this.ctx.fillStyle = COLORS.sky
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  rect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h)
  }

  sprite(
    grid: number[][],
    x: number,
    y: number,
    pixelSize: number,
    palette: Record<number, string>,
  ) {
    for (let row = 0; row < grid.length; row++) {
      const r = grid[row]
      if (!r) continue
      for (let col = 0; col < r.length; col++) {
        const cell = r[col]
        if (cell === undefined || cell === 0) continue
        const color = palette[cell]
        if (!color) continue
        this.ctx.fillStyle = color
        this.ctx.fillRect(
          Math.round(x + col * pixelSize),
          Math.round(y + row * pixelSize),
          pixelSize,
          pixelSize,
        )
      }
    }
  }

  text(
    str: string,
    x: number,
    y: number,
    color: string,
    size = 8,
    align: CanvasTextAlign = 'left',
  ) {
    this.ctx.fillStyle = color
    this.ctx.font = `${size}px monospace`
    this.ctx.textAlign = align
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(str, Math.round(x), Math.round(y))
  }
}
