# Recipe bowl

The left workspace owns the bowl and selected-items card. Ingredient/action-item
source lists remain in the team's two right-hand sections.

## What works

- Shared ingredient/appliance selection, counts, removal and clear-all.
- Drag a source item into the bowl opening to add it; drag a bowl bubble outside
  the opening to remove it. Dropping it back inside keeps it selected.
- Click/tap or Enter/Space also adds from a source button or removes a bowl bubble.
- Escape, pointer cancellation or loss of window focus cancels the drag.
  Releasing outside the browser viewport does not change the selection.
- Drop highlight, floating preview and addition animation with reduced-motion support.

Selections reset on refresh. Only 12 bubbles fit the artwork; extra selections
remain in the card. With at least one ingredient, **Mix & find a recipe** starts
stirring and opens a recipe dialog. Selection is locked while searching; Cancel
or Escape stops the search. Closing the dialog preserves the bowl and returns
focus to the search button. Reduced motion disables stirring and drop animations.

## Connecting source buttons

`App.tsx` already wraps the layout in `BowlSelectionProvider`.
`useBowlSelection()` exposes `items`, category counts, `addItem(item)`,
`removeItem({ id, type })` and `clearItems()`.

The frontend item format is `{ id, type, name, emoji? }`, where `type` is
`'ingredient'` or `'appliance'`. Use stable IDs; the same type and ID is selected
only once. The backend's action-item meaning and data format still need agreement.

For a component at `src/components/IngredientBubble.tsx`:

```tsx
import { useBowlDrag } from './recipe-bowl/useBowlDrag'
import type { BowlItem } from './recipe-bowl/selection'

export default function IngredientBubble({ item }: { item: BowlItem }) {
  const { bindItem } = useBowlDrag()
  return <button type="button" {...bindItem(item, 'source')}>{item.name}</button>
}
```

The binding handles pointer dragging and click/keyboard activation. Keep its
event handlers and `touchAction` style; do not add a second `onClick` handler.
For an unavailable item, pass `true` as the third argument and disable the button.
Source buttons should also read `locked` from `useBowlSelection()` and disable
themselves while it is true. The provider blocks selection mutations during search.
These bindings use React state and pointer capture, not native HTML drag data.

`usePointerDrag.ts` handles input and cancellation; `dragGeometry.ts` checks the
oval opening. `MixingBowl.tsx` layers the original PNGs in SVG, with the front
rim above the spoon. Changing artwork may require adjusting the oval and clip.

## Check locally

From `frontend`, run `npm run build`, `npm run lint`, then `npm run dev`.
Expand **Development: test selection and dragging** below the workspace.

- Drag tomato into the opening: one bubble, one selected item and one ingredient.
- Release pasta outside: nothing added. Click it or use Enter/Space to add it.
- Drag a bowl bubble back inside: keep it; release outside: remove it from both views.
- Press Escape or switch windows during a drag: selection stays unchanged.
- Remove through the card, clear all, re-add, and check the counts stay synchronized.
- Check touch dragging and scrolling from empty space; enable reduced motion to
  verify addition animations stop. Check the two right-hand sections still render.

The sample buttons are development-only (`import.meta.env.DEV`). Teammates can
connect their source buttons with the hook above.

## Recipe service

Without configuration, the UI labels itself **Demo mode** and displays a fixed
sample recipe, not a match for the submitted selection. The selected items are
shown separately. **Development: test recipe search** provides Success, Error
and Slow response scenarios. Test cancellation, retry, dialog scrolling,
Tab/Shift+Tab containment, Escape and focus restoration before committing.

`recipeService.ts` follows `backend/swagger.yml`: `GET /recipes?query=...`, with
an `application/json` string response. To connect a running backend, set
`VITE_RECIPE_API_BASE_URL` in a local `frontend/.env.local` and restart Vite.
Use the server base URL, without `/recipes`; the backend must allow the frontend
origin through CORS. Never put secrets in a `VITE_` variable. The free-text query
includes ingredient and appliance names; confirm its wording with the backend team.

`useRecipeFlow.ts` snapshots the selection, rejects repeated starts, aborts canceled
requests and times out after 30 seconds. Successful results wait at least 1.8 seconds
for the mixing sequence. `RecipeDialog.tsx` renders the returned string as plain text.
There are no backend, dependency, shared-layout or source-list changes in this step.
