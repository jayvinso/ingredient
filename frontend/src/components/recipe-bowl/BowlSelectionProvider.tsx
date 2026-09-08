import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { initialSelection, selectionReducer } from './selection'
import type { BowlItem, BowlItemIdentity } from './selection'
import { BowlDragContext } from './useBowlDrag'
import { usePointerDrag } from './usePointerDrag'
import { BowlSelectionContext } from './useBowlSelection'
import type { BowlSelectionValue } from './useBowlSelection'
import { useRecipeFlow } from './useRecipeFlow'
import { RecipeSearchContext } from './useRecipeSearch'

/** One provider around the page lets the bowl and source lists share state. */
export default function BowlSelectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(selectionReducer, initialSelection)
  const lockedRef = useRef(false)
  const [locked, setLocked] = useState(false)
  const lock = useCallback((value: boolean) => { lockedRef.current = value; setLocked(value) }, [])
  // Guard mutations centrally, including calls from future teammate components.
  const addItem = useCallback((item: BowlItem) => {
    if (!lockedRef.current) dispatch({ type: 'add', item })
  }, [])
  const removeItem = useCallback((item: BowlItemIdentity) => {
    if (!lockedRef.current) dispatch({ type: 'remove', item })
  }, [])
  const clearItems = useCallback(() => {
    if (!lockedRef.current) dispatch({ type: 'clear' })
  }, [])
  const dragValue = usePointerDrag(addItem, removeItem, locked)
  const recipe = useRecipeFlow(state.items, lock, dragValue.cancelDrag)

  const value = useMemo<BowlSelectionValue>(() => ({
    items: state.items,
    locked,
    announcement: state.announcement,
    pulse: state.pulse,
    lastAddedKey: state.lastAddedKey,
    ingredientCount: state.items.filter((item) => item.type === 'ingredient').length,
    applianceCount: state.items.filter((item) => item.type === 'appliance').length,
    addItem, removeItem, clearItems,
  }), [state, locked, addItem, removeItem, clearItems])

  return (
    <BowlSelectionContext.Provider value={value}>
      <BowlDragContext.Provider value={dragValue}>
        <RecipeSearchContext.Provider value={recipe}>{children}</RecipeSearchContext.Provider>
      </BowlDragContext.Provider>
    </BowlSelectionContext.Provider>
  )
}
