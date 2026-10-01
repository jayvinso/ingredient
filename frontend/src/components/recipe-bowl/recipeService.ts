// src/components/recipe-bowl/recipeService.ts
import { createRecipeClient } from './recipeClient'

export type { DemoScenario, RecipeResult } from './recipeClient'
export { waitFor } from './recipeClient'

const apiBase = import.meta.env.VITE_RECIPE_API_BASE_URL || '/api'
const client = createRecipeClient(apiBase)

export const isRecipeDemo = client.isDemo

export const requestRecipe = (items: readonly any[], signal?: AbortSignal) => {
  return client.requestRecipe(items, signal)
}

export const searchRecipes = requestRecipe