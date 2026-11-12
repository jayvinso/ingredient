import catalogUrl from './data/recipe-catalog.json?url'

export type CatalogRecipe = {
  id: string
  title: string
  ingredients: Record<string, number>
}

let pendingCatalog: Promise<CatalogRecipe[]> | undefined

export function loadRecipeCatalog(): Promise<CatalogRecipe[]> {
  if (!pendingCatalog) {
    pendingCatalog = fetch(catalogUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load the recipe catalog.')
        return await response.json() as CatalogRecipe[]
      })
      .catch((error: unknown) => {
        pendingCatalog = undefined
        throw error
      })
  }
  return pendingCatalog
}

export function suggestRecipes(catalog: CatalogRecipe[], input: string) {
  const query = input.trim().toLowerCase()
  if (query.length < 2) return []

  const starts: CatalogRecipe[] = []
  const contains: CatalogRecipe[] = []
  for (const recipe of catalog) {
    const title = recipe.title.toLowerCase()
    if (title.startsWith(query)) {
      starts.push(recipe)
      if (starts.length === 8) break
    } else if (contains.length < 8 && title.includes(query)) {
      contains.push(recipe)
    }
  }
  return starts.concat(contains).slice(0, 8)
}


export function chooseRecipe(catalog: CatalogRecipe[], previous?: CatalogRecipe) {
  if (catalog.length === 0) throw new Error('The recipe catalog is empty.')
  if (!previous || catalog.length === 1) {
    return catalog[Math.floor(Math.random() * catalog.length)]
  }

  const previousIndex = catalog.findIndex((item) => item.id === previous.id)
  if (previousIndex === -1) {
    return catalog[Math.floor(Math.random() * catalog.length)]
  }
  const index = Math.floor(Math.random() * (catalog.length - 1))
  return catalog[index >= previousIndex ? index + 1 : index]
}

export function scoreRecipe(guess: CatalogRecipe, target: CatalogRecipe) {
  if (guess.id === target.id) return 100

  let dot = 0
  let guessSquared = 0
  let targetSquared = 0

  for (const [ingredient, weight] of Object.entries(guess.ingredients)) {
    guessSquared += weight * weight
    if (Object.prototype.hasOwnProperty.call(target.ingredients, ingredient)) {
      dot += weight * target.ingredients[ingredient]
    }
  }
  for (const weight of Object.values(target.ingredients)) {
    targetSquared += weight * weight
  }

  const denominator = Math.sqrt(guessSquared * targetSquared)
  if (denominator === 0) return 0
  return Math.min(99, Math.round(100 * dot / denominator))
}
