import { useEffect, useId, useRef, useState } from 'react'
import MixingBowl from './MixingBowl'
import KitchenWindow from '../kitchen/KitchenWindow'
import SelectedItems from './SelectedItems'
import DragPreview from './DragPreview'
import { useBowlDrag } from './hooks/useBowlDrag'
import { MAX_VISIBLE_BOWL_ITEMS } from './utils/selection'
import { useBowlSelection } from './hooks/useBowlSelection'
import './RecipeWorkspace.css'
import RecipeDialog from './RecipeDialog'
import { useRecipeSearch } from './hooks/useRecipeSearch'
import { isRecipeDemo } from './services/recipeService'
import type { DemoScenario } from './services/recipeService'

export default function RecipeWorkspace() {
  const noteId = useId()
  const searchButton = useRef<HTMLButtonElement>(null)
  const wasBusy = useRef(false)

  const [scenario, setScenario] =
    useState<DemoScenario>('success')

  const recipe = useRecipeSearch()

  useEffect(() => {
    if (
      wasBusy.current &&
      !recipe.busy &&
      !recipe.result
    ) {
      searchButton.current?.focus()
    }

    wasBusy.current = recipe.busy
  }, [recipe.busy, recipe.result])

  const {
    items,
    ingredientCount,
    applianceCount,
    announcement,
  } = useBowlSelection()

  const { drag } = useBowlDrag()

  const hint = drag
    ? drag.origin === 'source'
      ? drag.overBowl
        ? 'Release to add'
        : 'Bring the bubble into the bowl'
      : drag.overBowl
        ? 'Release to keep it in the bowl'
        : 'Release to remove'
    : 'Drag bubbles into the bowl. Drag them out to remove.'

  const overflowCount = Math.max(
    0,
    items.length - MAX_VISIBLE_BOWL_ITEMS,
  )

  return (
    <div className="rb-workspace kitchen-workspace">
      <div className="kitchen-wall">
        <header className="rb-workspace-heading">
          <p className="rb-kicker">
            Make yourself at home
          </p>

          <h1>What&apos;s in your kitchen?</h1>

          <p>
            Pick ingredients from the pantry, add them
            to the bowl, and give it a stir.
          </p>
        </header>

        <KitchenWindow />
      </div>

      <div className="kitchen-counter">
        <div className="kitchen-counter__surface">
          <div className="rb-bowl-stage">
            <p className="rb-drop-hint">
              {recipe.busy
                ? 'Mixing your bowl…'
                : hint}
            </p>

            <MixingBowl />

            {overflowCount > 0 && (
              <p className="rb-overflow-note">
                +{overflowCount} more{' '}
                {overflowCount === 1
                  ? 'item'
                  : 'items'}{' '}
                in the selected list.
              </p>
            )}
          </div>

          <SelectedItems />
        </div>

        <div className="rb-bowl-actions">
          <p>
            {ingredientCount}{' '}
            {ingredientCount === 1
              ? 'ingredient'
              : 'ingredients'}
            {' · '}
            {applianceCount}{' '}
            {applianceCount === 1
              ? 'appliance'
              : 'appliances'}
          </p>

          <button
            ref={searchButton}
            type="button"
            disabled={
              ingredientCount === 0 ||
              recipe.busy ||
              Boolean(drag)
            }
            aria-describedby={noteId}
            onClick={() => recipe.start(scenario)}
          >
            {recipe.busy
              ? 'Mixing…'
              : recipe.error
                ? 'Try again'
                : 'Give it a stir'}
          </button>

          {recipe.busy && (
            <button
              className="rb-cancel-button"
              type="button"
              onClick={recipe.cancel}
            >
              Cancel search
            </button>
          )}

          <p id={noteId}>
            {isRecipeDemo
              ? 'Demo mode: shows a sample recipe, not a match for your selection.'
              : 'Only ingredients in the bowl are used for matching. Tools do not affect the results yet.'}

            {ingredientCount === 0 &&
              ' Add at least one ingredient to begin.'}
          </p>

          {recipe.status && (
            <p
              role="status"
              aria-live="polite"
            >
              {recipe.status}
            </p>
          )}

          {recipe.error && (
            <p
              className="rb-search-error"
              role="alert"
            >
              {recipe.error}
            </p>
          )}
        </div>
      </div>

      <div
        className="kitchen-base-cabinets"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>

      {import.meta.env.DEV && isRecipeDemo && (
        <details className="rb-devtools">
          <summary>
            Development: test recipe search
          </summary>

          <label>
            Demo response{' '}

            <select
              disabled={recipe.busy}
              onChange={(event) =>
                setScenario(
                  event.target.value as DemoScenario,
                )
              }
            >
              <option value="success">
                Success
              </option>

              <option value="error">
                Error
              </option>

              <option value="slow">
                Slow response (10 seconds)
              </option>
            </select>
          </label>
        </details>
      )}

      <DragPreview />

      {recipe.result && (
        <RecipeDialog
          result={recipe.result}
          items={recipe.submittedItems}
          onClose={recipe.close}
          returnFocus={searchButton}
        />
      )}

      <p
        className="rb-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {drag
          ? `${drag.item.name}. ${hint}. Press Escape to cancel.`
          : announcement}
      </p>
    </div>
  )
}