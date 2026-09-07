import { useId } from 'react'
import bowlImage from './assets/wooden-bowl.png'
import spoonImage from './assets/wooden-spoon.png'
import { itemKey, MAX_VISIBLE_BOWL_ITEMS, tokenPosition } from './selection'
import type { BowlItem, BowlItemIdentity } from './selection'

type MixingBowlProps = {
  items: readonly BowlItem[]
  onRemove: (item: BowlItemIdentity) => void
}

/**
 * Bowl and selected bubbles extracted from the standalone prototype.
 * Keep artwork in SVG coordinates so every layer scales together.
 * Item data comes from the shared selection; this component has no copy of it.
 */
export default function MixingBowl({ items, onRemove }: MixingBowlProps) {
  const id = useId()
  const titleId = `${id}-title`
  const frontClipId = `${id}-front`
  const visibleItems = items.slice(0, MAX_VISIBLE_BOWL_ITEMS)

  return (
    <svg
      className="rb-bowl-scene"
      viewBox="100 0 1336 1220"
      role="group"
      aria-labelledby={titleId}
    >
      <title id={titleId}>Recipe bowl. Activate a selected bubble to remove it.</title>
      <defs>
        <clipPath id={frontClipId} clipPathUnits="userSpaceOnUse">
          {/* Follows the front rim of this specific bowl image. */}
          <path d="M190 377 C238 481 472 571 768 572 C1060 572 1290 480 1345 377 L1536 1024 L0 1024 Z" />
        </clipPath>
      </defs>

      {/* Layer 1: the complete bowl. */}
      <image
        href={bowlImage}
        x="0"
        y="160"
        width="1536"
        height="1024"
        className="rb-bowl-base"
      />

      {/* Native HTML buttons provide mouse, touch, and keyboard removal. */}
      {visibleItems.map((item, index) => {
        const point = tokenPosition(index, visibleItems.length)
        return (
          <foreignObject
            key={itemKey(item)}
            x={point.x - 64}
            y={point.y - 64}
            width="128"
            height="128"
            className="rb-token-object"
          >
            <button
              type="button"
              className={`rb-bowl-token rb-bowl-token--${item.type}`}
              onClick={() => onRemove(item)}
              aria-label={`Remove ${item.name} (${item.type}) from the bowl`}
              title={`Remove ${item.name}`}
            >
              <span aria-hidden="true">{item.emoji ?? (item.type === 'ingredient' ? '🌿' : '⚙️')}</span>
            </button>
          </foreignObject>
        )
      })}

      {/* Layer 2: separate spoon; this group will move when mixing. */}
      <g transform="translate(895 680) rotate(28)" className="rb-spoon-rig">
        <image href={spoonImage} x="-256" y="-617" width="512" height="768" />
      </g>

      {/* Layer 3: redraw only the front, hiding the spoon behind the rim. */}
      <g transform="translate(0 160)" className="rb-bowl-front">
        <image
          href={bowlImage}
          width="1536"
          height="1024"
          clipPath={`url(#${frontClipId})`}
        />
      </g>
    </svg>
  )
}
