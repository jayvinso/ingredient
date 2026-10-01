// src/components/recipe-bowl/ingredientService.ts

import { createIngredientClient } from './ingredientClient'

// Force default to '/api' when environment variable is not defined
const apiBase = import.meta.env.VITE_RECIPE_API_BASE_URL || '/api'

const client = createIngredientClient(apiBase)
export const isIngredientDemo = client.isDemo
export const searchIngredients = client.searchIngredients