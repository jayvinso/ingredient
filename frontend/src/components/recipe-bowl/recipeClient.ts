export type DemoScenario = 'demo' | 'live' | string | unknown
export type RecipeResult = any

export function waitFor(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

export function createRecipeClient(baseUrl: string) {
  return {
    isDemo: false,
    async requestRecipe(items: readonly any[], signal?: AbortSignal) {
      const rawNames: string[] = []

      if (Array.isArray(items)) {
        items.forEach((item) => {
          // The current backend matches ingredients, not appliances.
          if (
            typeof item !== 'string' &&
            item?.type &&
            item.type !== 'ingredient'
          ) {
            return
          }

          const val =
            typeof item === 'string'
              ? item
              : item?.name || item?.label || ''

          if (val) rawNames.push(val)
        })
      } else if (typeof items === 'string') {
        rawNames.push(items)
      }

      const cleanItems = rawNames
        .map((name) =>
          name
            .replace(/Ingredients:/gi, '')
            .replace(/Appliances:/gi, '')
            .replace(/none selected/gi, '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)

      const queryString = cleanItems.join(',')
      const searchUrl = `${baseUrl}/recipes?query=${encodeURIComponent(queryString)}`

      const response = await fetch(searchUrl, { signal })
      if (!response.ok) {
        if (response.status === 404) {
          const errorBody = await response.json().catch(() => null)

          if (errorBody?.error?.code === 'no_recipe_match') {
            throw new Error(
              'No matching recipe was found. Try changing or adding ingredients.',
            )
          }
        }

        throw new Error(`Recipe search failed (HTTP ${response.status}).`)
      }

      const data = await response.json()

      // Normalize string response ("Chicken Roll-Ups") to all possible UI key names
      if (typeof data === 'string') {
        return {
          title: data,
          name: data,
          recipe: data,
          recipeName: data,
          label: data,
          text: data,
          description: data,
          summary: data,
          value: data,
          result: data,
          dish: data,
        }
      }

      return data
    },
  }
}