import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useKitchenFloat(
  rootRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const cards = [
      { selector: '.rb-workspace-heading', strength: 1 },
      { selector: '.rb-selection', strength: 0.8 },
      { selector: '.rb-drop-hint', strength: 0.55 },
    ].flatMap(({ selector, strength }) =>
      Array.from(
        root.querySelectorAll<HTMLElement>(selector),
        (element) => ({
          element,
          strength,
        }),
      ),
    )

    const preference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )

    let frame = 0
    let previousTime: number | null = null
    let target = 0
    let current = 0

    function paint() {
      for (const { element, strength } of cards) {
        element.style.setProperty(
          '--kitchen-scroll-y',
          `${(current * strength).toFixed(2)}px`,
        )
      }
    }

    function stop() {
      window.cancelAnimationFrame(frame)

      frame = 0
      previousTime = null
      target = 0
      current = 0

      paint()
    }

    function tick(time: number) {
      const elapsed = previousTime === null
        ? 16.67
        : Math.min(40, Math.max(0, time - previousTime))

      previousTime = time

      current += (
        target - current
      ) * (1 - Math.exp(-elapsed / 55))

      target *= Math.exp(-elapsed / 140)

      if (
        Math.abs(target) < 0.02 &&
        Math.abs(current) < 0.02
      ) {
        stop()
        return
      }

      paint()
      frame = window.requestAnimationFrame(tick)
    }

    const sources: Array<Window | HTMLElement> = [
      window,
      ...root.querySelectorAll<HTMLElement>('.kitchen-room'),
    ]

    const cleanups = sources.map((source) => {
      const position = () => source === window
        ? window.scrollY
        : (source as HTMLElement).scrollTop

      let previous = position()

      const onScroll = () => {
        const next = position()
        const delta = next - previous
        previous = next

        if (preference.matches || delta === 0) return

        target = Math.max(
          -8,
          Math.min(8, target + delta * 0.12),
        )

        if (!frame) {
          frame = window.requestAnimationFrame(tick)
        }
      }

      source.addEventListener('scroll', onScroll, {
        passive: true,
      })

      return () => {
        source.removeEventListener('scroll', onScroll)
      }
    })

    const onPreferenceChange = () => {
      if (preference.matches) stop()
    }

    preference.addEventListener('change', onPreferenceChange)

    return () => {
      stop()

      cleanups.forEach((cleanup) => cleanup())

      preference.removeEventListener(
        'change',
        onPreferenceChange,
      )

      cards.forEach(({ element }) => {
        element.style.removeProperty('--kitchen-scroll-y')
      })
    }
  }, [rootRef])
}