# Recipe bowl

The left workspace owns the bowl, spoon and selected-items card. The team's
ingredient/action-item source lists stay separate. On screens at most 760px wide,
the two source sections stack below the workspace.

## Behavior

- Add items by dragging a source button into the bowl, clicking it, or using
  Enter/Space. The same type and ID is selected only once.
- Remove through the card, activate a bowl bubble, or drag it outside the opening.
  Dropping back inside keeps it. Escape, focus loss and pointer cancellation
  cancel a drag; releasing outside the browser viewport does not remove an item.
- At least one ingredient enables search. Selection is locked during a request.
  Cancel/Escape stops it; errors allow retry. Closing the recipe preserves the
  bowl and returns focus to search.
- The bowl shows up to 12 bubbles; all selections remain in the card. Refresh resets
  selection. Demo source buttons only appear in development.

The spoon follows a continuous oval with eased startup and settling. The PNG
front layer masks it at the inner rim; replacing artwork requires retuning the
clip path. Reduced motion disables stirring and drop animations. Background
texture and shading use CSS, with no additional image assets.

## Connecting source lists

Components inside the existing `BowlSelectionProvider` use `useBowlSelection()`
for `items`, category counts, `locked`, `addItem(item)`, `removeItem({ id, type })`
and `clearItems()`. The provider blocks mutations while locked.

An item is `{ id, type, name, emoji? }`; type is `'ingredient'` or `'appliance'`.
Keep IDs stable. The backend's action-item meaning still needs team agreement.

Example for `src/components/IngredientBubble.tsx`:

```tsx
import { useBowlDrag } from './recipe-bowl/useBowlDrag'
import { useBowlSelection } from './recipe-bowl/useBowlSelection'
import type { BowlItem } from './recipe-bowl/selection'

export default function IngredientBubble({ item }: { item: BowlItem }) {
  const { bindItem } = useBowlDrag()
  const { locked } = useBowlSelection()
  return (
    <button type="button" {...bindItem(item, 'source', locked)} disabled={locked}>
      {item.name}
    </button>
  )
}
```

The binding includes click/keyboard activation and pointer capture. Preserve its
event handlers and touch-action style; do not attach a second add-on-click handler.

## Recipe service

Default **Demo mode** shows a labeled fixed recipe, not a selection-based match.
The submitted selection is shown separately. For a running backend, set
`VITE_RECIPE_API_BASE_URL` in local `frontend/.env.local` and restart Vite.
Use the base URL without `/recipes`; the backend must allow the frontend origin.
Vite variables are public, so do not put secrets in them.

`recipeClient.ts` implements Swagger's `GET /recipes?query=...` and JSON-string
response. `recipeService.ts` supplies Vite configuration. Confirm the free-text
query wording and appliance interpretation with the backend team before integration.
Requests use a copied selection, abort on cancellation and time out after 30 seconds.
Successful responses wait at least 1.8 seconds for mixing. API text is displayed
as plain text.

## Verification

From `frontend`: `npm test`, `npm run build`, `npm run lint`, `npm run dev`.
Tests use Node's runner and the existing TypeScript dependency. They cover selection,
drag handlers, request ownership/cancellation, the API contract and motion lifecycle.
Hook tests simulate events/state; they do not replace browser checks.

Before merging, check locally:

- Add/remove/clear, duplicate prevention and synchronized counts.
- Drag-back retention, drag-out removal, Escape and touch interaction.
- Spoon masking through a full cycle, smooth cancellation and reduced motion.
- Demo Success, Error/retry and Slow response/cancel controls under the workspace.
- Dialog scrolling, Tab/Shift+Tab containment, Escape and returned focus.
- Narrow/short windows, both source sections and a console without errors.

The demo flow is complete; production source-list wiring and the live backend
connection still depend on the other team components.
