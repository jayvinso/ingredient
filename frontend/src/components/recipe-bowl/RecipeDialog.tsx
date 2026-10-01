import { useEffect, useId, useRef } from 'react'
import type { RefObject } from 'react'
import type { BowlItem } from './selection'
import { itemKey } from './selection'
import type { RecipeResult } from './recipeService'

type Props = {
  result: RecipeResult
  items: readonly BowlItem[]
  onClose: () => void
  returnFocus: RefObject<HTMLButtonElement | null>
}

type ApproximateMatch = {
  selected: string
  recipe_ingredient: string
}

export default function RecipeDialog({
  result,
  items,
  onClose,
  returnFocus,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  const matched: string[] = result.matched_ingredients ?? []
  const missing: string[] = result.missing_ingredients ?? []
  const unmatched: string[] = result.unmatched_ingredients ?? []
  const approximate: ApproximateMatch[] = result.approximate_matches ?? []
  const hasDetails = Boolean(result.match_level)

  const matchLabel =
    result.match_level === 'strong'
      ? 'Full ingredient match'
      : result.match_level === 'partial'
        ? 'Partial ingredient match'
        : 'Weak ingredient match'

  const explanation =
    result.match_level === 'strong'
      ? 'All listed ingredients matched by name. Quantities are not checked.'
      : result.match_level === 'partial'
        ? 'Some ingredients match. Check the additional ingredients below.'
        : 'No exact ingredient matches. This is only a loosely related suggestion.'

  useEffect(() => {
    const node = dialog.current
    const focusTarget = returnFocus.current

    node?.showModal()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      node?.close()
      document.body.style.overflow = previousOverflow
      focusTarget?.focus()
    }
  }, [returnFocus])

  return (
    <dialog
      ref={dialog}
      className="rb-recipe-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
    >
      <header className="rb-recipe-header">
        <h2 id={titleId}>
          {result.isDemo ? 'Demo recipe' : 'Closest available recipe'}
        </h2>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Close recipe"
        >
          ×
        </button>
      </header>

      <p id={descriptionId}>
        {result.isDemo
          ? 'Preview only: this sample is not generated from your ingredients.'
          : hasDetails
            ? explanation
            : 'Recipe returned for the selection below.'}
      </p>

      <h3>Your submitted selection</h3>

      <ul className="rb-recipe-items">
        {items.map(item => (
          <li key={itemKey(item)}>
            {item.name} ({item.type})
          </li>
        ))}
      </ul>

      {items.some(item => item.type === 'appliance') && (
        <p>Appliances are not used by ingredient matching yet.</p>
      )}

      <div className="rb-recipe-text">
        <h3>{result.title ?? result.text}</h3>

        {hasDetails && (
          <>
            <p><strong>{matchLabel}</strong></p>

            <h3>Matching ingredients</h3>

            {matched.length > 0 ? (
              <ul className="rb-recipe-items">
                {matched.map(name => <li key={name}>{name}</li>)}
              </ul>
            ) : (
              <p>No exact matches.</p>
            )}

            {approximate.length > 0 && (
              <>
                <h3>Related ingredients</h3>
                <p>These are related names, not confirmed substitutions.</p>

                <ul className="rb-recipe-items">
                  {approximate.map(match => (
                    <li key={`${match.selected}:${match.recipe_ingredient}`}>
                      {match.selected} → {match.recipe_ingredient}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {missing.length > 0 && (
              <>
                <h3>Recipe ingredients not exactly matched</h3>

                <ul className="rb-recipe-items">
                  {missing.map(name => <li key={name}>{name}</li>)}
                </ul>
              </>
            )}

            {unmatched.length > 0 && (
              <>
                <h3>Selected ingredients without a match</h3>

                <ul className="rb-recipe-items">
                  {unmatched.map(name => <li key={name}>{name}</li>)}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        className="rb-recipe-back"
        onClick={onClose}
      >
        Back to the bowl
      </button>
    </dialog>
  )
}