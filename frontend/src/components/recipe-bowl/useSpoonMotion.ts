import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { advanceSpoon, RESTING_SPOON, spoonTransform } from './spoonMotion'

/** Update only the SVG transform, avoiding a React render on every frame. */
export function useSpoonMotion(ref: RefObject<SVGGElement | null>, stirring: boolean) {
  const motion = useRef(RESTING_SPOON)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let previous: number | undefined
    const tick = (time: number) => {
      motion.current = advanceSpoon(motion.current, previous === undefined ? 0 : time - previous, stirring)
      previous = time
      node.setAttribute('transform', spoonTransform(motion.current))
      if (stirring || motion.current.strength > 0) frame = requestAnimationFrame(tick)
    }
    const updatePreference = () => {
      cancelAnimationFrame(frame)
      previous = undefined
      if (preference.matches) {
        motion.current = RESTING_SPOON
        node.removeAttribute('transform')
      } else if (stirring || motion.current.strength > 0) {
        frame = requestAnimationFrame(tick)
      }
    }
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => {
      cancelAnimationFrame(frame)
      preference.removeEventListener('change', updatePreference)
    }
  }, [ref, stirring])
}
