import { useEffect, useState } from 'react'

// 지금은 접속 기기의 시계를 기준으로 계산합니다. 나중에 백엔드가 기준 시각을 내려주게 되면,
// now를 그 서버 시각으로 바꿔치기만 하면 됩니다(기기 시계 오차 문제 해결).
export function useLiveDuration(targetIso, direction) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!targetIso) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [targetIso])

  if (!targetIso) return null
  const target = new Date(targetIso).getTime()
  const ms = direction === 'elapsed' ? now - target : target - now
  if (ms <= 0) return null
  const totalSeconds = Math.floor(ms / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    minutes: totalMinutes % 60,
    seconds: totalSeconds % 60,
  }
}
