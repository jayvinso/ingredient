# Recipe bowl

The bowl workspace occupies the main left section. The two far-right
ingredient/action-item lists remain separate.

## Current functionality

- Shared ingredient/appliance selection with duplicate prevention.
- Selected-items card, category counts, removal and clear-all.
- Matching bowl bubbles; click/tap or use Enter/Space to remove.
- Static bowl/spoon artwork; mixing and recipe search remain disabled.

Selections reset on a full page refresh. The bowl displays up to 12 bubbles;
additional selections remain in the list and an overflow count is shown.

## Main files

All component files are in `src/components/recipe-bowl/`:

- `RecipeWorkspace.tsx` / `RecipeWorkspace.css` — left workspace.
- `MixingBowl.tsx` — PNG layers and selected bubbles.
- `SelectedItems.tsx` — grouped selection card.
- `selection.ts` — item types, reducer and bubble positions.
- `BowlSelectionProvider.tsx` / `useBowlSelection.ts` — shared state.
- `SelectionDevTools.tsx` — temporary development-only test buttons.

SVG positions the PNGs together; a clipped front layer hides the lower spoon.
Changing the bowl artwork may require adjusting its clip path.

## Connecting a teammate's component

`App.tsx` wraps the layout in one `BowlSelectionProvider`. Components inside
it can call `useBowlSelection()` to access `items`, `ingredientCount`,
`applianceCount`, `addItem(item)`, `removeItem({ id, type })`, and `clearItems()`.

The proposed frontend item format is:

```ts
{ id: 'tomato', type: 'ingredient', name: 'Tomato', emoji: '🍅' }
```

`type` is `'ingredient'` or `'appliance'`; `emoji` is optional.
The same type and ID is selected only once. Keep IDs stable; names are labels.
Pass a complete item to `addItem`; no hardcoded catalog lookup is required.
Call the hook at the top of a component, then call `addItem` in its click handler.
The backend's meaning of `action-items` and its data format still need agreement.

## Checking changes

From `frontend`:

```sh
npm run build
npm run lint
npm run dev
```

Expand **Development: test selection** at the bottom of the left panel.
Add tomato twice: there should be one tomato. Add pasta and oven: expect
two ingredients, one appliance, and three bubbles. Remove through the card
and bowl; check both update together. Empty the bowl and re-add an item.

Tab through controls and activate a remove button with Enter/Space.
Refresh to confirm the empty state, and check that the two right boxes
remain unchanged. Search stays disabled even when ingredients are selected.

Test controls use `import.meta.env.DEV`: they appear with `npm run dev`,
not in production builds. No backend request is made in this milestone.
