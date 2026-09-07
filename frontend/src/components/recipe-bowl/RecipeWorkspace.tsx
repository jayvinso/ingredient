import { useId } from 'react'
import MixingBowl from './MixingBowl'
import './RecipeWorkspace.css'

/**
 * Joshua's left-side workspace, not the application's full page.
 * Ingredient/appliance source lists stay in the team's right-hand sections.
 * Milestone 1 is intentionally visual-only and makes no API requests.
 */
export default function RecipeWorkspace() {
  const noteId = useId()

  return (
    <div className="rb-workspace">
      <header className="rb-workspace-heading">
        <p className="rb-kicker">The mixing table</p>
        <h1>What's in your kitchen?</h1>
        <p>Combine your ingredients and appliances to find a recipe.</p>
      </header>

      <div className="rb-bowl-stage">
        <MixingBowl />
      </div>

      <div className="rb-bowl-actions">
        {/* Disabled until selection and search behavior are connected. */}
        <button type="button" disabled aria-describedby={noteId}>
          Mix &amp; find a recipe
        </button>
        <p id={noteId}>Bowl preview — selection and mixing are not connected yet.</p>
      </div>
    </div>
  )
}
