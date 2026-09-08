import type { BowlItem } from './selection'

export type DemoScenario = 'success' | 'error' | 'slow'
export type RecipeResult = { text: string; isDemo: boolean }

/** Abortable delay shared by the preview service and minimum mixing time. */
export function waitFor(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Canceled', 'AbortError')); return }
    const abort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(new DOMException('Canceled', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
}

export function recipeQuery(items: readonly BowlItem[]): string {
  const names = (type: BowlItem['type']) => items.filter(item => item.type === type).map(item => item.name).join(', ')
  return `Ingredients: ${names('ingredient')}. Appliances: ${names('appliance') || 'none selected'}.`
}

/** Injectable transport keeps the Swagger contract testable without a server. */
export function createRecipeClient(baseUrl = '', transport: typeof fetch = fetch) {
  const apiBase = baseUrl.trim().replace(/\/+$/, '')
  const isDemo = !apiBase
  async function requestRecipe(
    items: readonly BowlItem[], signal: AbortSignal, scenario: DemoScenario = 'success',
  ): Promise<RecipeResult> {
    if (isDemo) {
      await waitFor(scenario === 'slow' ? 10000 : 600, signal)
      if (scenario === 'error') throw new Error('Simulated search failure. Choose Success in the demo controls and try again.')
      return {
        isDemo: true,
        text: `Tomato pasta — sample recipe\n\nIngredients\nPasta, tomatoes, olive oil, salt and pepper.\n\nMethod\n1. Cook the pasta according to its package directions.\n2. Gently cook chopped tomatoes in olive oil until softened.\n3. Toss the drained pasta with the tomatoes and season to taste.\n\nThis fixed example demonstrates the recipe display. It is not generated from your selection.`,
      }
    }
    const query = new URLSearchParams({ query: recipeQuery(items) })
    const response = await transport(`${apiBase}/recipes?${query}`, {
      signal, headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`Recipe search failed (HTTP ${response.status}). Please try again.`)
    let text: unknown
    try {
      text = await response.json()
    } catch {
      signal.throwIfAborted()
      throw new Error('The recipe service returned unreadable data. Please try again.')
    }
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('The recipe service returned an empty or unexpected response. Please try again.')
    }
    return { text, isDemo: false }
  }
  return { isDemo, requestRecipe }
}
