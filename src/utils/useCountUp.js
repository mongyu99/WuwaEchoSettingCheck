import { useEffect, useRef, useState } from 'react'

// 숫자가 바뀌면 이전 값에서 새 값까지 "촤르륵" 올라갑니다. 끝에서 살짝 넘쳤다가 돌아와 쫀득하게 멈춥니다.
const DURATION_MS = 700
// 0→1로 가다가 1을 조금 넘었다 돌아오는 곡선(easeOutBack).
const easeOutBack = (t) => {
  const c = 1.4
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
}

/** value까지 부드럽게 따라가는 표시용 숫자를 돌려줍니다. 모션 줄이기 설정이면 바로 바뀝니다. */
export function useCountUp(value) {
  const [shown, setShown] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(value)
      fromRef.current = value
      return undefined
    }
    const from = fromRef.current
    const start = performance.now()
    let frame = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION_MS)
      const next = from + (value - from) * easeOutBack(t)
      setShown(next)
      fromRef.current = next
      if (t < 1) frame = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return shown
}
