import { useEffect, useId, useRef, useState } from 'react'
import { itemKey } from './selection'
import type { BowlItem } from './selection'
import { useBowlSelection } from './useBowlSelection'
import { useBowlDrag } from './useBowlDrag'
import { searchIngredients } from './ingredientService'

type SearchResponse = {
  key: string
  items: BowlItem[]
  error: string | null
}

export function IngredientSearch() {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [retry, setRetry] = useState(0)
  const [response, setResponse] = useState<SearchResponse | null>(null)

  const { items, locked } = useBowlSelection()
  const { bindItem } = useBowlDrag()

  const query = searchTerm.trim()
  const requestKey = `${retry}:${query}`
  const canSearch = query.length >= 2
  const current = response?.key === requestKey ? response : null
  const loading = canSearch && !current
  const results = canSearch ? current?.items ?? [] : []
  const error = canSearch ? current?.error : null
  const hintId = `${id}-hint`

  useEffect(() => {
    if (query.length < 2) return

    const controller = new AbortController()
    let active = true

    const timer = window.setTimeout(async () => {
      try {
        const matches = await searchIngredients(query, controller.signal)
        if (!active) return

        const names = [...new Set(matches.map((name) => name.trim()))]
          .filter(Boolean)

        const mappedItems: BowlItem[] = names.map((name) => ({
          id: `ingredient-${name.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'ingredient',
          name,
          emoji: '🥗',
        }))

        setResponse({
          key: requestKey,
          items: mappedItems,
          error: null,
        })
      } catch {
        if (!active || controller.signal.aborted) return

        setResponse({
          key: requestKey,
          items: [],
          error: 'Search is unavailable for that name. Try another ingredient or retry.',
        })
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, requestKey])

  function clearSearch() {
    setSearchTerm('')
    inputRef.current?.focus()
  }

  const statusText = !query
    ? 'Search for something you have on hand.'
    : !canSearch
      ? 'Type at least two characters.'
      : loading
        ? 'Finding ingredients…'
        : error
          ? ''
          : results.length === 0
            ? 'No ingredients found. Try another name.'
            : 'Click a match or drag it into your bowl.'

  return (
    <div className="ingredient-search">
      <label
        className="ingredient-search__label"
        htmlFor={`${id}-input`}
      >
        Search ingredients
      </label>

      <div className="ingredient-search__field">
        <svg
          className="ingredient-search__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>

        <input
          ref={inputRef}
          id={`${id}-input`}
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Try onion, cheese…"
          className="ingredient-search__input"
          aria-describedby={hintId}
          autoComplete="off"
          spellCheck={false}
        />

        {searchTerm && (
          <button
            type="button"
            className="ingredient-search__clear"
            onClick={clearSearch}
            aria-label="Clear ingredient search"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
        )}
      </div>

      <p
        id={hintId}
        className="ingredient-search__status"
        role="status"
        aria-atomic="true"
      >
        {loading && (
          <span className="ingredient-search__spinner" aria-hidden="true" />
        )}
        {statusText}
      </p>

      {error && (
        <div className="ingredient-search__error">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="ingredient-search__results">
          <p className="ingredient-search__results-label">
            {results.length === 1 ? 'Closest match' : 'Matches'}
            <span>{results.length}</span>
          </p>

          <div className="source-samples__items">
            {results.map((item) => {
              const selected = items.some(
                (entry) => itemKey(entry) === itemKey(item),
              )

              return (
                <button
                  key={itemKey(item)}
                  type="button"
                  {...bindItem(item, 'source', selected || locked)}
                  className={selected ? 'ingredient-search__item is-selected' : 'ingredient-search__item'}
                  disabled={selected || locked}
                  aria-label={
                    selected
                      ? `${item.name}, already added to the bowl`
                      : `Add ${item.name} to the bowl`
                  }
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  <span>{item.name}</span>
                  {selected && <span aria-hidden="true">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}