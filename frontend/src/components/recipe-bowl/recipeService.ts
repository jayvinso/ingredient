import { createRecipeClient } from './recipeClient'
export { waitFor } from './recipeClient'
export type { DemoScenario, RecipeResult } from './recipeClient'

// Vite configuration stays separate from the independently testable transport.
const client = createRecipeClient(import.meta.env.VITE_RECIPE_API_BASE_URL ?? '')
export const isRecipeDemo = client.isDemo
export const requestRecipe = client.requestRecipe
