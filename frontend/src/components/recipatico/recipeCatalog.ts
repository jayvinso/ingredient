export type CatalogRecipe = {
  id: string
  title: string
  ingredients: Record<string, number>
}

export { loadRecipeCatalog, scoreRecipe } from './recipeSimilarity'

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
