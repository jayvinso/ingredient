import { createPortal } from 'react-dom'
import { useBowlDrag } from './useBowlDrag'

export default function DragPreview() {
  const { drag } = useBowlDrag()
  if (!drag) return null
  const removing = drag.origin === 'bowl' && !drag.overBowl
  const label = drag.origin === 'source'
    ? drag.overBowl ? 'Release to add' : 'Bring into the bowl'
    : drag.overBowl ? 'Release to keep' : 'Release to remove'

  return createPortal(
    <div
      className={`rb-drag-preview ${removing ? 'is-removing' : ''}`}
      style={{ left: drag.x, top: drag.y }}
      aria-hidden="true"
    >
      <span>{drag.item.emoji ?? (drag.item.type === 'ingredient' ? '🌿' : '⚙️')}</span>
      <strong>{drag.item.name}</strong>
      <small>{label}</small>
    </div>,
    document.body,
  )
}
