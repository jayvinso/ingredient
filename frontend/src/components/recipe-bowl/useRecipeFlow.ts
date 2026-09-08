import { useCallback, useEffect, useRef, useState } from 'react'
import type { BowlItem } from './selection'
import { requestRecipe, waitFor } from './recipeService'
import type { DemoScenario, RecipeResult } from './recipeService'
import type { RecipeSearchValue } from './useRecipeSearch'

/** Each run owns a controller; canceled or older runs cannot publish results. */
export function useRecipeFlow(
  items: readonly BowlItem[], lock: (value: boolean) => void, cancelDrag: () => void,
): RecipeSearchValue {
  const active = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<RecipeResult | null>(null)
  const [submittedItems, setSubmittedItems] = useState<readonly BowlItem[]>([])

  const cancel = useCallback(() => {
    if (!active.current) return
    const controller = active.current
    active.current = null
    controller.abort()
    lock(false)
    setBusy(false)
    setStatus('Search canceled. Your bowl is unchanged.')
  }, [lock])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && active.current) { event.preventDefault(); cancel() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      const controller = active.current
      active.current = null
      controller?.abort()
    }
  }, [cancel])

  async function run(scenario: DemoScenario) {
    if (active.current || !items.some(item => item.type === 'ingredient')) return
    const controller = new AbortController()
    active.current = controller // Synchronous guard against double activation.
    const snapshot = items.map(item => ({ ...item }))
    cancelDrag()
    lock(true)
    setBusy(true)
    setError('')
    setResult(null)
    setSubmittedItems(snapshot)
    setStatus('Mixing and finding a recipe. Press Escape to cancel.')
    let timedOut = false
    const timeout = setTimeout(() => { timedOut = true; controller.abort() }, 30000)
    try {
      const [recipe] = await Promise.all([
        requestRecipe(snapshot, controller.signal, scenario),
        waitFor(1800, controller.signal),
      ])
      if (active.current !== controller) return
      controller.signal.throwIfAborted()
      setResult(recipe)
      setStatus('Your recipe is ready.')
    } catch (cause) {
      if (active.current !== controller) return
      controller.abort() // Also stop the minimum-duration timer on service failure.
      setError(timedOut ? 'Recipe search took too long. Please try again.'
        : cause instanceof Error ? cause.message : 'Recipe search failed. Please try again.')
      setStatus('')
    } finally {
      clearTimeout(timeout)
      if (active.current === controller) {
        active.current = null
        lock(false)
        setBusy(false)
      }
    }
  }

  return {
    busy, error, status, result, submittedItems,
    start: (scenario = 'success') => { void run(scenario) },
    cancel,
    close: () => { setResult(null); setStatus('Recipe closed. Your bowl is unchanged.') },
  }
}
