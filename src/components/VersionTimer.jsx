import { useEffect, useState } from 'react'
import { VERSION_BANNER } from '../config/versionBanner'
import './VersionTimer.css'

// 지금은 접속 기기의 시계를 기준으로 계산합니다. 나중에 백엔드가 기준 시각을 내려주게 되면,
// now를 그 서버 시각으로 바꿔치기만 하면 됩니다(기기 시계 오차 문제 해결).
function useLiveDuration(targetIso, direction) {
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

export default function VersionTimer() {
  const { startsAt, endsAt } = VERSION_BANNER
  const elapsedSinceStart = useLiveDuration(startsAt, 'elapsed')
  const remainingUntilEnd = useLiveDuration(endsAt, 'remaining')

  if (!startsAt && !endsAt) return null

  return (
    <div className="version-timer">
      <span className="version-timer__row">
        버전 시작한지{' '}
        {elapsedSinceStart ? (
          <strong>
            {elapsedSinceStart.days}일 {elapsedSinceStart.hours}시간 {elapsedSinceStart.minutes}분{' '}
            {elapsedSinceStart.seconds}초
          </strong>
        ) : (
          <strong>시작 전</strong>
        )}
      </span>
      <span className="version-timer__row">
        버전 끝나기(패스 기준) 전{' '}
        {remainingUntilEnd ? (
          <strong>
            {remainingUntilEnd.days}일 {remainingUntilEnd.hours}시간 {remainingUntilEnd.minutes}분{' '}
            {remainingUntilEnd.seconds}초
          </strong>
        ) : (
          <strong>종료됨</strong>
        )}
      </span>
    </div>
  )
}
