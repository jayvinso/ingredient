import { useId } from 'react'
import bowlImage from './assets/wooden-bowl.png'
import spoonImage from './assets/wooden-spoon.png'

/**
 * Visual-only bowl extracted from the standalone prototype.
 * Keep artwork in SVG coordinates so every layer scales together.
 * Selection rendering, drop handling, and motion arrive in later commits.
 */
export default function MixingBowl() {
  const id = useId()
  const titleId = `${id}-title`
  const frontClipId = `${id}-front`

  return (
    <svg
      className="rb-bowl-scene"
      viewBox="100 0 1336 1220"
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>Wooden mixing bowl with a wooden spoon</title>
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
