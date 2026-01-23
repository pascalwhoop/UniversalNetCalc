import { useEffect, useState, useRef } from "react"

/**
 * Hook for animating numbers from 0 to target value
 * Uses requestAnimationFrame for smooth 60fps animation
 */
export function useCountUp(
  target: number,
  duration: number = 800,
  enabled: boolean = true
): number {
  const [count, setCount] = useState(enabled ? 0 : target)
  const frameRef = useRef<number>()
  const startTimeRef = useRef<number>()
  const startValueRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) {
      setCount(target)
      return
    }

    // Reset for new target
    startTimeRef.current = undefined
    startValueRef.current = count

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic for smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentCount = startValueRef.current + (target - startValueRef.current) * easeOutCubic

      setCount(currentCount)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [target, duration, enabled])

  return count
}
