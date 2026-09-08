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

/** Native modal dialog supplies focus containment and makes the page inert. */
export default function RecipeDialog({ result, items, onClose, returnFocus }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
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
    <dialog ref={dialog} className="rb-recipe-dialog" aria-labelledby={titleId}
      aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); onClose() }}>
      <header className="rb-recipe-header">
        <h2 id={titleId}>{result.isDemo ? 'Demo recipe' : 'Your recipe'}</h2>
        <button type="button" onClick={onClose} autoFocus aria-label="Close recipe">×</button>
      </header>
      <p id={descriptionId}>{result.isDemo
        ? 'Preview only: this sample is not generated from your ingredients.'
        : 'Recipe returned for the selection below.'}</p>
      <h3>Your submitted selection</h3>
      <ul className="rb-recipe-items">
        {items.map(item => <li key={itemKey(item)}>{item.name} ({item.type})</li>)}
      </ul>
      {/* Render API text as text, never as injected HTML. */}
      <div className="rb-recipe-text">{result.text}</div>
      <button type="button" className="rb-recipe-back" onClick={onClose}>Back to the bowl</button>
    </dialog>
  )
}
