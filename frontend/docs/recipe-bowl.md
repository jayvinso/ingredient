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
remain in the card. Mixing and recipe search are still disabled.

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
connect their source buttons with the hook above. No backend request is made yet.
