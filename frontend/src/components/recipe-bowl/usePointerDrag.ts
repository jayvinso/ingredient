import { useCallback, useEffect, useRef, useState } from 'react'
import type { BowlItem, BowlItemIdentity } from './selection'
import type { BowlDrag, BowlDragValue, DragBindings } from './useBowlDrag'
import { dropAction, insideEllipse } from './dragGeometry'
import type { DragOrigin } from './dragGeometry'

type PendingDrag = {
  item: BowlItem
  origin: DragOrigin
  startX: number
  startY: number
  pointerId: number
  active: boolean
  element: HTMLButtonElement
}

/** Pointer capture supports mouse, touch and pen without native HTML dragging. */
export function usePointerDrag(
  addItem: (item: BowlItem) => void,
  removeItem: (item: BowlItemIdentity) => void,
  locked = false,
): BowlDragValue {
  const bowlRef = useRef<SVGEllipseElement>(null)
  const pending = useRef<PendingDrag | null>(null)
  const suppressClick = useRef<HTMLButtonElement | null>(null)
  const [drag, setDrag] = useState<BowlDrag | null>(null)

  const finish = useCallback((suppress: boolean) => {
    const current = pending.current
    pending.current = null // Clear before release; release can trigger lost-capture.
    if (current && suppress) suppressClick.current = current.element
    if (current?.element.hasPointerCapture(current.pointerId)) {
      current.element.releasePointerCapture(current.pointerId)
    }
    setDrag(null)
  }, [])

  const cancelDrag = useCallback(() => finish(true), [finish])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pending.current) {
        event.preventDefault()
        cancelDrag()
      }
    }
    const onVisibility = () => { if (document.hidden) cancelDrag() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('blur', cancelDrag)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', cancelDrag)
      document.removeEventListener('visibilitychange', onVisibility)
      const current = pending.current
      pending.current = null
      if (current?.element.hasPointerCapture(current.pointerId)) {
        current.element.releasePointerCapture(current.pointerId)
      }
    }
  }, [cancelDrag])

  function overOpening(x: number, y: number): boolean {
    const opening = bowlRef.current
    if (!opening || !insideEllipse(x, y, opening.getBoundingClientRect())) return false
    // Reject a portion of the SVG that is scrolled out of view or covered.
    const scene = opening.ownerSVGElement
    const hit = document.elementFromPoint(x, y)
    return !!hit && !!scene?.contains(hit)
  }

  function bindItem(item: BowlItem, origin: DragOrigin, unavailable = false): DragBindings {
    unavailable = unavailable || locked
    return {
      draggable: false,
      style: { touchAction: 'none', userSelect: 'none' },
      onDragStart: (event) => event.preventDefault(),
      onPointerDown(event) {
        if (unavailable || !event.isPrimary || event.button !== 0 || pending.current) return
        suppressClick.current = null // A new intentional click must remain usable.
        pending.current = {
          item, origin, startX: event.clientX, startY: event.clientY,
          pointerId: event.pointerId, active: false, element: event.currentTarget,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove(event) {
        const current = pending.current
        if (!current || current.pointerId !== event.pointerId) return
        if (!current.active && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 7) return
        current.active = true
        setDrag({
          item: current.item, origin: current.origin,
          x: event.clientX, y: event.clientY,
          overBowl: overOpening(event.clientX, event.clientY),
        })
      },
      onPointerUp(event) {
        const current = pending.current
        if (!current || current.pointerId !== event.pointerId) return
        const inViewport = event.clientX >= 0 && event.clientX < window.innerWidth &&
          event.clientY >= 0 && event.clientY < window.innerHeight
        const action = current.active
          ? dropAction(current.origin, overOpening(event.clientX, event.clientY), unavailable, inViewport)
          : null
        finish(current.active || !inViewport)
        if (action === 'add') addItem(current.item)
        if (action === 'remove') removeItem(current.item)
      },
      onPointerCancel(event) {
        if (pending.current?.pointerId === event.pointerId) cancelDrag()
      },
      onLostPointerCapture(event) {
        if (pending.current?.pointerId === event.pointerId) cancelDrag()
      },
      onClick(event) {
        // Ignore the synthetic click following a drag/cancel, but not keyboard clicks.
        if (event.detail !== 0 && suppressClick.current === event.currentTarget) {
          suppressClick.current = null
          event.preventDefault()
          return
        }
        if (unavailable || pending.current?.active) return
        if (origin === 'source') addItem(item)
        else removeItem(item)
      },
    }
  }

  return { drag, bowlRef, bindItem, cancelDrag }
}
