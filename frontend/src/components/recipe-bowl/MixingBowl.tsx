import { useId, useRef } from 'react'
import bowlImage from './assets/wooden-bowl.png'
import spoonImage from './assets/wooden-spoon.png'
import { itemKey, MAX_VISIBLE_BOWL_ITEMS, tokenPosition } from './selection'
import { useBowlSelection } from './useBowlSelection'
import { useBowlDrag } from './useBowlDrag'
import { useDropFeedback } from './useDropFeedback'
import { useSpoonMotion } from './useSpoonMotion'

/** PNG layers share one SVG coordinate system with the drop target and tokens. */
export default function MixingBowl() {
  const id = useId()
  const bodyRef = useRef<SVGGElement>(null)
  const spoonRef = useRef<SVGGElement>(null)
  const { items, locked, pulse, lastAddedKey } = useBowlSelection()
  const { drag, bowlRef, bindItem } = useBowlDrag()
  const titleId = `${id}-title`
  const frontClipId = `${id}-front`
  const visibleItems = items.slice(0, MAX_VISIBLE_BOWL_ITEMS)
  useDropFeedback(bodyRef, pulse)
  useSpoonMotion(spoonRef, locked)

  return (
    <svg
      className={`rb-bowl-scene ${drag?.overBowl ? 'is-over' : ''} ${locked ? 'is-mixing' : ''}`}
      viewBox="100 0 1336 1220"
      role="group"
      aria-labelledby={titleId}
    >
      <title id={titleId}>Recipe bowl. Drag bubbles out, or activate them to remove.</title>
      <defs>
        <clipPath id={frontClipId} clipPathUnits="userSpaceOnUse">
          {/* Raised slightly along the inner lip to hide the spoon above the outer edge. */}
          <path d="M190 382 C238 480 472 566 768 567 C1060 567 1290 469 1345 382 L1536 1024 L0 1024 Z" />
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
                disabled={locked}
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

        <g ref={spoonRef} className="rb-stir-motion">
          <g transform="translate(895 690) rotate(28)" className="rb-spoon-rig">
            <image href={spoonImage} x="-256" y="-617" width="512" height="768" />
          </g>
        </g>
        {/* Redraw the front above the spoon to hide its lower end. */}
        <g transform="translate(0 160)" className="rb-bowl-front">
          <image href={bowlImage} width="1536" height="1024" clipPath={`url(#${frontClipId})`} />
        </g>
      </g>
    </svg>
  )
}
