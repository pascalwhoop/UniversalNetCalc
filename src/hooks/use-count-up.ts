import { useEffect, useState } from "react"

/**
 * Animates a number value from start to end with smooth easing
 * Uses requestAnimationFrame for 60fps performance
 */
export function useCountUp(
  end: number,
  options: {
    start?: number
    duration?: number
    enabled?: boolean
  } = {}
) {
  const { start = 0, duration = 800, enabled = true } = options
  const [count, setCount] = useState(start)

  useEffect(() => {
    if (!enabled) {
      setCount(end)
      return
    }

    // If already at target, don't animate
    if (count === end) return

    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)

      // easeOutCubic easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)

      setCount(start + (end - start) * easeOutCubic)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [end, start, duration, enabled, count])

  return Math.round(count)
}
