/** Motion System tokens (motion/react). Prefer transform/opacity only. */

export const motionTokens = {
  duration: {
    fast: 0.18,
    normal: 0.35,
    slow: 0.6,
  },
  easing: {
    smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
    sharp: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  distance: {
    sm: 8,
    md: 16,
    lg: 24,
  },
}

/** Cheap capability signal for shortening motion on weak hardware. */
export function isLowEndDevice() {
  if (typeof navigator === "undefined") return false
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (memory !== undefined && memory <= 2) return true
  if (memory === undefined && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) return true
  return false
}

export function motionDuration(kind: keyof typeof motionTokens.duration = "normal", reduce = false) {
  if (reduce) return 0.08
  const base = motionTokens.duration[kind]
  return isLowEndDevice() ? Math.min(base, 0.2) : base
}
