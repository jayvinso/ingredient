import { useCallback, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { initialSelection, selectionReducer } from './selection'
import type { BowlItem, BowlItemIdentity } from './selection'
import { BowlDragContext } from './useBowlDrag'
import { usePointerDrag } from './usePointerDrag'
import { BowlSelectionContext } from './useBowlSelection'
import type { BowlSelectionValue } from './useBowlSelection'

/** One provider around the page lets the bowl and source lists share state. */
export default function BowlSelectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(selectionReducer, initialSelection)
  const addItem = useCallback((item: BowlItem) => dispatch({ type: 'add', item }), [])
  const removeItem = useCallback((item: BowlItemIdentity) => dispatch({ type: 'remove', item }), [])
  const clearItems = useCallback(() => dispatch({ type: 'clear' }), [])
  const dragValue = usePointerDrag(addItem, removeItem)

  const value = useMemo<BowlSelectionValue>(() => ({
    items: state.items,
    announcement: state.announcement,
    pulse: state.pulse,
    lastAddedKey: state.lastAddedKey,
    ingredientCount: state.items.filter((item) => item.type === 'ingredient').length,
    applianceCount: state.items.filter((item) => item.type === 'appliance').length,
    addItem, removeItem, clearItems,
  }), [state, addItem, removeItem, clearItems])

  return (
    <BowlSelectionContext.Provider value={value}>
      <BowlDragContext.Provider value={dragValue}>
        {children}
      </BowlDragContext.Provider>
    </BowlSelectionContext.Provider>
  )
}
