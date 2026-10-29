import { useEffect, useId, useRef } from 'react'
import type { RefObject } from 'react'
import type { BowlItem } from './utils/selection'
import { itemKey } from './utils/selection'
import type { RecipeResult } from './services/recipeService'
import './RecipeCard.css'

type Props = {
  result: RecipeResult
  items: readonly BowlItem[]
  onClose: () => void
  returnFocus: RefObject<HTMLButtonElement | null>
}

function IngredientNames({
  names,
  emptyText,
}: {
  names: readonly string[]
  emptyText?: string
}) {
  if (!names.length) {
    return emptyText ? (
      <p className="recipe-card__note">{emptyText}</p>
    ) : null
  }

  return (
    <ul className="recipe-card__list">
      {names.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  )
}

export default function RecipeDialog({
  result,
  items,
  onClose,
  returnFocus,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closingAnimation = useRef<Animation | null>(null)

  const titleId = useId()
  const descriptionId = useId()

  const title = result.title?.trim() || result.text.trim()
  const notes = result.text.trim() !== title ? result.text : ''

  const matched = result.matched_ingredients ?? []
  const missing = result.missing_ingredients ?? []
  const unmatched = result.unmatched_ingredients ?? []
  const approximate = result.approximate_matches ?? []
  const hasDetails = Boolean(result.match_level)

  const matchLabel = result.match_level === 'strong'
    ? 'Full ingredient match'
    : result.match_level === 'partial'
      ? 'Partial ingredient match'
      : 'Weak ingredient match'

  const explanation = result.isDemo
    ? 'Preview only: this sample is not generated from your ingredients.'
    : !hasDetails
      ? 'Recipe returned for the selection below.'
      : result.match_level === 'strong'
        ? 'All listed ingredients matched by name. Quantities are not checked.'
        : result.match_level === 'partial'
          ? 'Some ingredients match. Check the additional ingredients below.'
          : 'No exact ingredient matches. This is only a loosely related suggestion.'

  useEffect(() => {
    const node = dialog.current
    const focusTarget = returnFocus.current
    const previousOverflow = document.body.style.overflow

    if (node && !node.open) {
      node.showModal()
    }

    document.body.style.overflow = 'hidden'

    return () => {
      closingAnimation.current?.cancel()
      node?.close()

      document.body.style.overflow = previousOverflow

      if (focusTarget?.isConnected) {
        focusTarget.focus({ preventScroll: true })
      }
    }
  }, [returnFocus])

  function closeCard() {
    if (closingAnimation.current) return

    const node = dialog.current

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (
      !node ||
      reducedMotion ||
      typeof node.animate !== 'function'
    ) {
      onClose()
      return
    }

    const animation = node.animate(
      [
        {
          transform: window.getComputedStyle(node).transform,
        },
        {
          transform: 'translateY(calc(50dvh + 50% + 24px))',
        },
      ],
      {
        duration: 240,
        easing: 'cubic-bezier(.4, 0, 1, 1)',
        fill: 'forwards',
      },
    )

    closingAnimation.current = animation

    void animation.finished.then(
      () => {
        if (node.isConnected) onClose()
      },
      () => {
        closingAnimation.current = null
      },
    )
  }

  return (
    <dialog
      ref={dialog}
      className="recipe-card-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        closeCard()
      }}
    >
      <div className="recipe-card__tab" aria-hidden="true">
        Recipe box
      </div>

      <article className="recipe-card">
        <header className="recipe-card__header">
          <div className="recipe-card__heading">
            <p className="recipe-card__eyebrow">
              {result.isDemo
                ? 'Demo recipe'
                : 'Closest available recipe'}
            </p>

            <h2 id={titleId}>{title}</h2>
          </div>

          <button
            type="button"
            className="recipe-card__close"
            onClick={closeCard}
            aria-label="Close recipe"
            autoFocus
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div
          className="recipe-card__body"
          role="region"
          aria-label="Recipe details"
          tabIndex={0}
        >
          <p id={descriptionId} className="recipe-card__intro">
            {explanation}
          </p>

          {notes && (
            <section className="recipe-card__notes">
              <h3>Recipe notes</h3>
              <p>{notes}</p>
            </section>
          )}

          <section className="recipe-card__selection">
            <h3>Your submitted selection</h3>

            <ul className="recipe-card__selection-list">
              {items.map((item) => (
                <li key={itemKey(item)}>
                  <span>{item.name}</span>

                  <span className="recipe-card__item-type">
                    {item.type}
                  </span>
                </li>
              ))}
            </ul>

            {items.some((item) => item.type === 'appliance') && (
              <p className="recipe-card__note">
                Appliances are not used by ingredient matching yet.
              </p>
            )}
          </section>

          {hasDetails && (
            <>
              <p className="recipe-card__match">
                {matchLabel}
              </p>

              <div className="recipe-card__columns">
                <section>
                  <h3>Matching ingredients</h3>

                  <IngredientNames
                    names={matched}
                    emptyText="No exact matches."
                  />
                </section>

                {missing.length > 0 && (
                  <section>
                    <h3>Recipe ingredients not exactly matched</h3>
                    <IngredientNames names={missing} />
                  </section>
                )}

                {approximate.length > 0 && (
                  <section>
                    <h3>Related ingredients</h3>

                    <p className="recipe-card__note">
                      These are related names, not confirmed
                      substitutions.
                    </p>

                    <ul className="recipe-card__list">
                      {approximate.map((match) => (
                        <li
                          key={`${match.selected}:${match.recipe_ingredient}`}
                        >
                          {match.selected} → {match.recipe_ingredient}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {unmatched.length > 0 && (
                  <section>
                    <h3>Selected ingredients without a match</h3>
                    <IngredientNames names={unmatched} />
                  </section>
                )}
              </div>
            </>
          )}
        </div>

        <footer className="recipe-card__footer">
          <p>A little something good.</p>

          <button
            type="button"
            className="recipe-card__back"
            onClick={closeCard}
          >
            Back to the bowl
          </button>
        </footer>
      </article>
    </dialog>
  )
}