import React, { useState, useEffect } from 'react'
import { itemKey } from './selection'
import type { BowlItem } from './selection'
import { useBowlSelection } from './useBowlSelection'
import { useBowlDrag } from './useBowlDrag'
import { searchIngredients } from './ingredientService'

export function IngredientSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<BowlItem[]>([])
  const [loading, setLoading] = useState(false)

  const { items, locked } = useBowlSelection()
  const { bindItem } = useBowlDrag()

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const matches = await searchIngredients(searchTerm, controller.signal)
        const mappedItems: BowlItem[] = matches.map((name) => ({
          id: `ingredient-${name.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'ingredient',
          name,
          emoji: '🥗', // Default ingredient icon
        }))
        setResults(mappedItems)
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Search error:', err)
        }
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchTerm])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className="source-samples">
      <input
        type="search"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder="Type ingredient..."
        className="source-panel__input"
        style={{ width: '100%', marginBottom: '1rem' }}
      />

      {loading && <p className="source-samples__hint">Searching backend...</p>}

      {results.length > 0 && (
        <div className="source-samples__items">
          {results.map((item) => {
            const selected = items.some(
              (entry) => itemKey(entry) === itemKey(item),
            )

            return (
              <button
                key={itemKey(item)}
                type="button"
                {...bindItem(item, 'source', selected)}
                disabled={selected || locked}
                aria-label={
                  selected
                    ? `${item.name}, already added`
                    : `Add ${item.name}`
                }
              >
                <span aria-hidden="true">{item.emoji}</span>
                <span>{item.name}</span>
                {selected && <span aria-hidden="true">✓</span>}
              </button>
            )
          })}
        </div>
      )}

      {results.length > 0 && (
        <p className="source-samples__hint">
          Click an item or drag it into the bowl.
        </p>
      )}
    </div>
  )
}