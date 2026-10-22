export type DragOrigin = 'source' | 'bowl'
export type Rect = { left: number; top: number; width: number; height: number }

/** Uses the opening's current screen bounds, so resizing does not break drops. */
export function insideEllipse(x: number, y: number, rect: Rect | undefined): boolean {
  if (!rect || rect.width <= 0 || rect.height <= 0) return false
  const dx = (x - rect.left - rect.width / 2) / (rect.width / 2)
  const dy = (y - rect.top - rect.height / 2) / (rect.height / 2)
  return dx * dx + dy * dy <= 1
}

export function dropAction(
  origin: DragOrigin,
  overBowl: boolean,
  canceled: boolean,
  inViewport: boolean,
): 'add' | 'remove' | null {
  if (canceled || !inViewport) return null
  if (origin === 'source' && overBowl) return 'add'
  if (origin === 'bowl' && !overBowl) return 'remove'
  return null
}
