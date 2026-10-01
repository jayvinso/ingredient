import type { BowlItem } from './selection'

export type DemoScenario = string

export type RecipeResult = {
  title: string
  text: string
  isDemo: false
  match_level?: 'strong' | 'partial' | 'weak'
  matched_ingredients?: string[]
  approximate_matches?: Array<{
    selected: string
    recipe_ingredient: string
  }>
  missing_ingredients?: string[]
  unmatched_ingredients?: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isText)
}

function normalizeRecipe(data: unknown): RecipeResult {
  // Keep compatibility with the previous JSON-string response.
  if (isText(data)) {
    return {
      title: data.trim(),
      text: data.trim(),
      isDemo: false,
    }
  }

  if (
    !isRecord(data) ||
    !isText(data.title) ||
    !isText(data.text) ||
    !['strong', 'partial', 'weak'].includes(String(data.match_level)) ||
    !isTextList(data.matched_ingredients) ||
    !isTextList(data.missing_ingredients) ||
    !isTextList(data.unmatched_ingredients) ||
    !Array.isArray(data.approximate_matches) ||
    !data.approximate_matches.every(
      (match: unknown) =>
        isRecord(match) &&
        isText(match.selected) &&
        isText(match.recipe_ingredient),
    )
  ) {
    throw new Error('Recipe search returned an unexpected response.')
  }

  return {
    ...data,
    title: data.title.trim(),
    text: data.text.trim(),
    isDemo: false,
  } as RecipeResult
}

export function waitFor(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      return
    }

    const onAbort = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'))
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function createRecipeClient(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
) {
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/recipes`

  return {
    isDemo: false,

    async requestRecipe(
      items: readonly (BowlItem | string)[],
      signal?: AbortSignal,
    ): Promise<RecipeResult> {
      signal?.throwIfAborted()

      const names = items
        .filter(item => typeof item === 'string' || item.type === 'ingredient')
        .map(item => typeof item === 'string' ? item : item.name)
        .map(name =>
          name
            .replace(/[^a-zA-Z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean)

      const query = [...new Set(names)].join(',')

      if (!query) {
        throw new Error('Add at least one ingredient before searching.')
      }

      const response = await fetcher(
        `${endpoint}?query=${encodeURIComponent(query)}`,
        {
          signal,
          headers: { Accept: 'application/json' },
        },
      )

      signal?.throwIfAborted()

      if (!response.ok) {
        if (response.status === 404) {
          const body: unknown = await response.json().catch(() => null)
          signal?.throwIfAborted()

          if (
            isRecord(body) &&
            isRecord(body.error) &&
            body.error.code === 'no_recipe_match'
          ) {
            throw new Error(
              'No matching recipe was found. Try changing or adding ingredients.',
            )
          }
        }

        throw new Error(`Recipe search failed (HTTP ${response.status}).`)
      }

      let data: unknown

      try {
        data = await response.json()
      } catch (cause) {
        signal?.throwIfAborted()

        if (cause instanceof Error && cause.name === 'AbortError') {
          throw cause
        }

        throw new Error('Recipe search returned unreadable data.')
      }

      signal?.throwIfAborted()

      return normalizeRecipe(data)
    },
  }
}