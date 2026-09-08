export type SpoonMotion = { phase: number; strength: number }
export const RESTING_SPOON: SpoonMotion = { phase: 0, strength: 0 }

/** Continuous oval, with frame-rate-independent acceleration and settling. */
export function advanceSpoon(current: SpoonMotion, elapsedMs: number, stirring: boolean): SpoonMotion {
  const dt = Math.max(0, Math.min(elapsedMs, 40))
  const target = stirring ? 1 : 0
  const strength = current.strength + (target - current.strength) * (1 - Math.exp(-dt / 120))
  if (!stirring && strength < 0.002) return RESTING_SPOON
  return { strength, phase: (current.phase + dt * Math.PI * 2 / 1200) % (Math.PI * 2) }
}

export function spoonTransform({ phase, strength }: SpoonMotion): string {
  const sweep = (1 - Math.cos(phase)) * strength
  const lift = Math.sin(phase) * strength
  return `translate(${-62 * sweep} ${-22 * lift}) rotate(${-6 * sweep + 2 * lift} 768 523)`
}
