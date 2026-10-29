import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/** Brief bowl nudge after an actual addition; respect live motion preferences. */
export function useDropFeedback(bodyRef: RefObject<SVGGElement | null>, pulse: number) {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!pulse || reduced || !bodyRef.current?.animate) return
    const animation = bodyRef.current.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(7px)', offset: 0.36 },
      { transform: 'translateY(-2px)', offset: 0.7 },
      { transform: 'translateY(0)' },
    ], { duration: 380, easing: 'ease-out' })
    return () => animation.cancel()
  }, [pulse, reduced, bodyRef])
}
