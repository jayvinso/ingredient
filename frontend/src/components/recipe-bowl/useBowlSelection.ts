import { createContext, useContext } from 'react'
import type { BowlItem, BowlItemIdentity } from './selection'

export type BowlSelectionValue = {
  items: readonly BowlItem[]
  ingredientCount: number
  applianceCount: number
  announcement: string
  addItem: (item: BowlItem) => void
  removeItem: (item: BowlItemIdentity) => void
  clearItems: () => void
}

export const BowlSelectionContext = createContext<BowlSelectionValue | null>(null)

/** Use inside the provider, including in future source-list components. */
export function useBowlSelection(): BowlSelectionValue {
  const selection = useContext(BowlSelectionContext)
  if (!selection) {
    throw new Error('useBowlSelection must be used inside BowlSelectionProvider')
  }
  return selection
}
