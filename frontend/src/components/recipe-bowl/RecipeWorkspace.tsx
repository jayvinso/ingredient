import { useEffect, useId, useRef, useState } from 'react'
import MixingBowl from './MixingBowl'
import SelectedItems from './SelectedItems'
import SelectionDevTools from './SelectionDevTools'
import DragPreview from './DragPreview'
import { useBowlDrag } from './useBowlDrag'
import { MAX_VISIBLE_BOWL_ITEMS } from './selection'
import { useBowlSelection } from './useBowlSelection'
import './RecipeWorkspace.css'
import RecipeDialog from './RecipeDialog'
import { useRecipeSearch } from './useRecipeSearch'
import { isRecipeDemo } from './recipeService'
import type { DemoScenario } from './recipeService'

/** Left workspace only; the two right-hand source-list sections remain separate. */
export default function RecipeWorkspace() {
  const noteId = useId()
  const searchButton = useRef<HTMLButtonElement>(null)
  const wasBusy = useRef(false)
  const [scenario, setScenario] = useState<DemoScenario>('success')
  const recipe = useRecipeSearch()
  useEffect(() => {
    if (wasBusy.current && !recipe.busy && !recipe.result) searchButton.current?.focus()
    wasBusy.current = recipe.busy
  }, [recipe.busy, recipe.result])
  const { items, ingredientCount, applianceCount, announcement } = useBowlSelection()
  const { drag } = useBowlDrag()
  const hint = drag
    ? drag.origin === 'source'
      ? drag.overBowl ? 'Release to add' : 'Bring the bubble into the bowl'
      : drag.overBowl ? 'Release to keep it in the bowl' : 'Release to remove'
    : 'Drag bubbles into the bowl. Drag them out to remove.'
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
          <p className="rb-drop-hint">{recipe.busy ? 'Mixing your bowl…' : hint}</p>
          <MixingBowl />
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
          <button ref={searchButton} type="button"
            disabled={ingredientCount === 0 || recipe.busy || !!drag}
            aria-describedby={noteId} onClick={() => recipe.start(scenario)}>
            {recipe.busy ? 'Mixing…' : recipe.error ? 'Try again' : 'Mix & find a recipe'}
          </button>
          {recipe.busy && <button type="button" onClick={recipe.cancel}>Cancel search</button>}
          <p id={noteId}>{isRecipeDemo
            ? 'Demo mode: shows a sample recipe, not a match for your selection.'
            : 'Find a recipe using your selected ingredients and appliances.'}
            {ingredientCount === 0 && ' Add at least one ingredient to begin.'}</p>
          <p role="status" aria-live="polite">{recipe.status}</p>
          {recipe.error && <p className="rb-search-error" role="alert">{recipe.error}</p>}
        </div>
      </div>

      {import.meta.env.DEV && <SelectionDevTools />}
      {import.meta.env.DEV && isRecipeDemo && (
        <details className="rb-devtools">
          <summary>Development: test recipe search</summary>
          <label>Demo response{' '}
            <select value={scenario} disabled={recipe.busy}
              onChange={event => setScenario(event.target.value as DemoScenario)}>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="slow">Slow response (10 seconds)</option>
            </select>
          </label>
        </details>
      )}
      <DragPreview />
      {recipe.result && <RecipeDialog result={recipe.result} items={recipe.submittedItems}
        onClose={recipe.close} returnFocus={searchButton} />}
      <p className="rb-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {drag ? `${drag.item.name}. ${hint}. Press Escape to cancel.` : announcement}
      </p>
    </div>
  )
}
