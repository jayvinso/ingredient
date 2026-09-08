import { useId } from 'react'
import { itemKey } from './selection'
import { useBowlSelection } from './useBowlSelection'
import { useBowlDrag } from './useBowlDrag'

/** The selected-items card belongs inside the left workspace. */
export default function SelectedItems() {
  const headingId = useId()
  const { items, removeItem, clearItems } = useBowlSelection()
  const { drag } = useBowlDrag()

  return (
    <aside className="rb-selection" aria-labelledby={headingId}>
      <div className="rb-selection-heading">
        <h2 id={headingId}>In the bowl</h2>
        <span className="rb-selection-count" aria-label={`${items.length} selected items`}>
          {items.length}
        </span>
      </div>

      {(['ingredient', 'appliance'] as const).map((type) => {
        const group = items.filter((item) => item.type === type)
        return (
          <div key={type} className="rb-selected-group">
            <h3>{type === 'ingredient' ? 'Ingredients' : 'Appliances'} ({group.length})</h3>
            {group.length === 0 ? <p>None added yet.</p> : (
              <ul>
                {group.map((item) => (
                  <li key={itemKey(item)}>
                    <span aria-hidden="true">{item.emoji ?? (type === 'ingredient' ? '🌿' : '⚙️')}</span>
                    <span className="rb-selected-name">{item.name}</span>
                    <button
                      className="rb-remove-button"
                      type="button"
                      disabled={!!drag}
                      onClick={() => removeItem(item)}
                      aria-label={`Remove ${item.name} (${item.type})`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}

      <button
        className="rb-clear-button"
        type="button"
        disabled={items.length === 0 || !!drag}
        onClick={clearItems}
      >
        Empty the bowl
      </button>
    </aside>
  )
}
