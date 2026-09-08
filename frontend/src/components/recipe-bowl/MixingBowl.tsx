import { useId, useRef } from 'react'
import bowlImage from './assets/wooden-bowl.png'
import spoonImage from './assets/wooden-spoon.png'
import { itemKey, MAX_VISIBLE_BOWL_ITEMS, tokenPosition } from './selection'
import { useBowlSelection } from './useBowlSelection'
import { useBowlDrag } from './useBowlDrag'
import { useDropFeedback } from './useDropFeedback'

/** PNG layers share one SVG coordinate system with the drop target and tokens. */
export default function MixingBowl() {
  const id = useId()
  const bodyRef = useRef<SVGGElement>(null)
  const { items, pulse, lastAddedKey } = useBowlSelection()
  const { drag, bowlRef, bindItem } = useBowlDrag()
  const titleId = `${id}-title`
  const frontClipId = `${id}-front`
  const visibleItems = items.slice(0, MAX_VISIBLE_BOWL_ITEMS)
  useDropFeedback(bodyRef, pulse)

  return (
    <svg
      className={`rb-bowl-scene ${drag?.overBowl ? 'is-over' : ''}`}
      viewBox="100 0 1336 1220"
      role="group"
      aria-labelledby={titleId}
    >
      <title id={titleId}>Recipe bowl. Drag bubbles out, or activate them to remove.</title>
      <defs>
        <clipPath id={frontClipId} clipPathUnits="userSpaceOnUse">
          {/* This curve follows the front rim of the original bowl PNG. */}
          <path d="M190 377 C238 481 472 571 768 572 C1060 572 1290 480 1345 377 L1536 1024 L0 1024 Z" />
        </clipPath>
      </defs>

      <g ref={bodyRef}>
        <image
          href={bowlImage}
          x="0" y="160" width="1536" height="1024"
          className="rb-bowl-base"
        />
        {/* The actual opening, rather than the image's rectangular bounds. */}
        <ellipse
          ref={bowlRef}
          cx="768" cy="523" rx="552" ry="213"
          className="rb-drop-zone"
          aria-hidden="true"
        />

        {visibleItems.map((item, index) => {
          const point = tokenPosition(index, visibleItems.length)
          const key = itemKey(item)
          const moving = drag?.origin === 'bowl' && itemKey(drag.item) === key
          return (
            <foreignObject
              key={key}
              x={point.x - 64} y={point.y - 64} width="128" height="128"
              className="rb-token-object"
            >
              <button
                type="button"
                {...bindItem(item, 'bowl')}
                className={`rb-bowl-token rb-bowl-token--${item.type} ${lastAddedKey === key ? 'is-new' : ''} ${moving ? 'is-dragged' : ''}`}
                aria-label={`Remove ${item.name} (${item.type}) from the bowl`}
                title={`${item.name}: drag outside the bowl, or click to remove`}
              >
                <span aria-hidden="true">{item.emoji ?? (item.type === 'ingredient' ? '🌿' : '⚙️')}</span>
              </button>
            </foreignObject>
          )
        })}

        <g transform="translate(895 680) rotate(28)" className="rb-spoon-rig">
          <image href={spoonImage} x="-256" y="-617" width="512" height="768" />
        </g>
        {/* Redraw the front above the spoon to hide its lower end. */}
        <g transform="translate(0 160)" className="rb-bowl-front">
          <image href={bowlImage} width="1536" height="1024" clipPath={`url(#${frontClipId})`} />
        </g>
      </g>
    </svg>
  )
}
