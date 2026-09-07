import { useId } from 'react'
import MixingBowl from './MixingBowl'
import SelectedItems from './SelectedItems'
import SelectionDevTools from './SelectionDevTools'
import { MAX_VISIBLE_BOWL_ITEMS } from './selection'
import { useBowlSelection } from './useBowlSelection'
import './RecipeWorkspace.css'

/** Left workspace only; the two right-hand source-list sections remain separate. */
export default function RecipeWorkspace() {
  const noteId = useId()
  const { items, removeItem, ingredientCount, applianceCount, announcement } = useBowlSelection()
  const overflowCount = Math.max(0, items.length - MAX_VISIBLE_BOWL_ITEMS)

  return (
    <div className="rb-workspace">
      <div className="rb-workspace-grid">
        <header className="rb-workspace-heading">
          <p className="rb-kicker">The mixing table</p>
          <h1>What's in your kitchen?</h1>
          <p>Combine your ingredients and appliances to find a recipe.</p>
        </header>

        <SelectedItems />

        <div className="rb-bowl-stage">
          <MixingBowl items={items} onRemove={removeItem} />
          {overflowCount > 0 && (
            <p className="rb-overflow-note">
              +{overflowCount} more {overflowCount === 1 ? 'item' : 'items'} in the selected list.
            </p>
          )}
        </div>

        <div className="rb-bowl-actions">
          <p>
            {ingredientCount} {ingredientCount === 1 ? 'ingredient' : 'ingredients'}
            {' · '}
            {applianceCount} {applianceCount === 1 ? 'appliance' : 'appliances'}
          </p>
          {/* Selection works now; mixing/search is a later milestone. */}
          <button type="button" disabled aria-describedby={noteId}>
            Mix &amp; find a recipe
          </button>
          <p id={noteId}>Mixing and recipe search are not connected yet.</p>
        </div>
      </div>

      {import.meta.env.DEV && <SelectionDevTools />}
      <p className="rb-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  )
}
