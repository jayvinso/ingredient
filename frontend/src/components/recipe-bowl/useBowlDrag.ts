import { createContext, useContext } from 'react'
import type { ButtonHTMLAttributes, RefObject } from 'react'
import type { BowlItem } from './selection'
import type { DragOrigin } from './dragGeometry'

export type BowlDrag = {
  item: BowlItem
  origin: DragOrigin
  x: number
  y: number
  overBowl: boolean
}

export type DragBindings = Pick<ButtonHTMLAttributes<HTMLButtonElement>,
  'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' |
  'onLostPointerCapture' | 'onClick' | 'onDragStart' | 'draggable' | 'style'>

export type BowlDragValue = {
  drag: BowlDrag | null
  bowlRef: RefObject<SVGEllipseElement | null>
  bindItem: (item: BowlItem, origin: DragOrigin, unavailable?: boolean) => DragBindings
  cancelDrag: () => void
}

export const BowlDragContext = createContext<BowlDragValue | null>(null)

/** Shared by source bubbles and the bowl under BowlSelectionProvider. */
export function useBowlDrag(): BowlDragValue {
  const value = useContext(BowlDragContext)
  if (!value) throw new Error('useBowlDrag must be used inside BowlSelectionProvider')
  return value
}
