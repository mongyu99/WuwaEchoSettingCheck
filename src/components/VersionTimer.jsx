import { useLiveDuration } from '../utils/useLiveDuration'
import './VersionTimer.css'

/** 지금 보이는 메인 배너의 기간(startsAt ~ endsAt) 기준으로 경과·남은 시간을 보여줍니다. */
export default function VersionTimer({ startsAt, endsAt }) {
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
