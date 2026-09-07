import { useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { initialSelection, selectionReducer } from './selection'
import { BowlSelectionContext } from './useBowlSelection'
import type { BowlSelectionValue } from './useBowlSelection'

/** One provider around the page lets the bowl and source lists share state. */
export default function BowlSelectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(selectionReducer, initialSelection)

  const value = useMemo<BowlSelectionValue>(() => ({
    items: state.items,
    announcement: state.announcement,
    ingredientCount: state.items.filter((item) => item.type === 'ingredient').length,
    applianceCount: state.items.filter((item) => item.type === 'appliance').length,
    addItem: (item) => dispatch({ type: 'add', item }),
    removeItem: (item) => dispatch({ type: 'remove', item }),
    clearItems: () => dispatch({ type: 'clear' }),
  }), [state])

  return (
    <BowlSelectionContext.Provider value={value}>
      {children}
    </BowlSelectionContext.Provider>
  )
}
