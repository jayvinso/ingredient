export type BowlItemType = 'ingredient' | 'appliance'

/** Proposed frontend item format; independent of any API response format. */
export type BowlItem = Readonly<{
  id: string
  type: BowlItemType
  name: string
  emoji?: string
}>

export type BowlItemIdentity = Pick<BowlItem, 'id' | 'type'>
export type SelectionState = {
  items: readonly BowlItem[]
  announcement: string
}
export type SelectionAction =
  | { type: 'add'; item: BowlItem }
  | { type: 'remove'; item: BowlItemIdentity }
  | { type: 'clear' }

export const initialSelection: SelectionState = { items: [], announcement: '' }

/** IDs only need to be unique within their ingredient/appliance category. */
export function itemKey(item: BowlItemIdentity): string {
  return `${item.type}:${item.id}`
}

/** All selection changes pass through here, keeping consumers synchronized. */
export function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'add': {
      if (!action.item.id.trim() || !action.item.name.trim()) return state
      if (state.items.some((item) => itemKey(item) === itemKey(action.item))) return state
      return {
        items: [...state.items, { ...action.item }],
        announcement: `${action.item.name} added to the bowl.`,
      }
    }
    case 'remove': {
      const removed = state.items.find((item) => itemKey(item) === itemKey(action.item))
      if (!removed) return state
      return {
        items: state.items.filter((item) => itemKey(item) !== itemKey(removed)),
        announcement: `${removed.name} removed from the bowl.`,
      }
    }
    case 'clear':
      if (!state.items.length) return state
      return { items: [], announcement: 'The bowl is empty.' }
  }
}

// At most three rows fit this artwork. Extra items stay in the selected list.
export const MAX_VISIBLE_BOWL_ITEMS = 12

/** Positions in the original PNG/SVG coordinate system, not screen pixels. */
export function tokenPosition(index: number, visibleCount: number) {
  const row = Math.floor(index / 4)
  const rowSize = Math.min(4, visibleCount - row * 4)
  return {
    x: 750 + (index % 4 - (rowSize - 1) / 2) * 154,
    y: 424 + row * 110,
  }
}
