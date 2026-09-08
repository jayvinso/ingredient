import { itemKey } from './selection'
import type { BowlItem } from './selection'
import { useBowlSelection } from './useBowlSelection'
import { useBowlDrag } from './useBowlDrag'

const samples: readonly BowlItem[] = [
  { id: 'demo-tomato', type: 'ingredient', name: 'Tomato', emoji: '🍅' },
  { id: 'demo-pasta', type: 'ingredient', name: 'Pasta', emoji: '🍝' },
  { id: 'demo-oven', type: 'appliance', name: 'Oven', emoji: '♨️' },
]

/** Temporary drag sources only; not the team's production ingredient lists. */
export default function SelectionDevTools() {
  const { items, locked } = useBowlSelection()
  const { bindItem } = useBowlDrag()

  return (
    <details className="rb-devtools">
      <summary>Development: test selection and dragging</summary>
      <p>Drag a sample into the bowl, or click to add. Drag selected bubbles out to remove. Escape cancels a drag.</p>
      <div className="rb-devtools-actions">
        {samples.map((item) => {
          const selected = items.some((entry) => itemKey(entry) === itemKey(item))
          return (
            <button
              key={itemKey(item)}
              type="button"
              {...bindItem(item, 'source', selected)}
              disabled={selected || locked}
              aria-label={selected ? `${item.name}, already added` : `Add ${item.name}`}
            >
              <span aria-hidden="true">{item.emoji}</span>{' '}
              {item.name}{selected ? ' ✓' : ''}
            </button>
          )
        })}
      </div>
    </details>
  )
}
