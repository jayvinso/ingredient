import { createContext, useContext } from 'react'
import type { BowlItem } from './selection'
import type { DemoScenario, RecipeResult } from './recipeService'

export type RecipeSearchValue = {
  busy: boolean
  error: string
  status: string
  result: RecipeResult | null
  submittedItems: readonly BowlItem[]
  start: (scenario?: DemoScenario) => void
  cancel: () => void
  close: () => void
}
export const RecipeSearchContext = createContext<RecipeSearchValue | null>(null)
export function useRecipeSearch(): RecipeSearchValue {
  const value = useContext(RecipeSearchContext)
  if (!value) throw new Error('useRecipeSearch must be used inside BowlSelectionProvider')
  return value
}
