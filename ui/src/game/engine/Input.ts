export type GameAction = 'left' | 'right' | 'jump' | 'shoot' | 'special' | 'pause'

const KEY_MAP: Record<string, GameAction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'jump',
  ' ': 'shoot',
  z: 'special',
  Z: 'special',
  p: 'pause',
  P: 'pause',
}

export class Input {
  private held = new Set<GameAction>()
  private justPressedSet = new Set<GameAction>()
  private touchHeld = new Set<GameAction>()

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  endFrame() {
    this.justPressedSet.clear()
  }

  isHeld(action: GameAction): boolean {
    return this.held.has(action) || this.touchHeld.has(action)
  }

  justPressed(action: GameAction): boolean {
    return this.justPressedSet.has(action)
  }

  touchStart(action: GameAction) {
    this.touchHeld.add(action)
    this.justPressedSet.add(action)
  }

  touchEnd(action: GameAction) {
    this.touchHeld.delete(action)
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.key]
    if (!action) return
    e.preventDefault()
    if (!this.held.has(action)) {
      this.justPressedSet.add(action)
    }
    this.held.add(action)
  }

  private onKeyUp = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.key]
    if (!action) return
    this.held.delete(action)
  }
}
