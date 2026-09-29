import { itemKey } from './selection'
import type { BowlItem, BowlItemType } from './selection'
import { useBowlSelection } from './useBowlSelection'
import { useBowlDrag } from './useBowlDrag'

const samples: readonly BowlItem[] = [
  {
    id: 'demo-tomato',
    type: 'ingredient',
    name: 'Tomato',
    emoji: '🍅',
  },
  {
    id: 'demo-pasta',
    type: 'ingredient',
    name: 'Pasta',
    emoji: '🍝',
  },
  {
    id: 'demo-oven',
    type: 'appliance',
    name: 'Oven',
    emoji: '♨️',
  },
]

type SelectionDevToolsProps = {
  type: BowlItemType
}

export default function SelectionDevTools({
  type,
}: SelectionDevToolsProps) {
  const { items, locked } = useBowlSelection()
  const { bindItem } = useBowlDrag()

  const visibleSamples = samples.filter((item) => item.type === type)

  return (
    <div className="source-samples">
      <p className="source-samples__label">Try these samples</p>

      <div className="source-samples__items">
        {visibleSamples.map((item) => {
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

      <p className="source-samples__hint">
        Click an item or drag it into the bowl.
      </p>
    </div>
  )
}