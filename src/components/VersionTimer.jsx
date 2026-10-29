import { useLiveDuration } from '../utils/useLiveDuration'
import './VersionTimer.css'

// 시·분·초를 두 자리로 맞춰서, 숫자가 바뀌어도 알약 폭이 흔들리지 않게 합니다.
const pad = (n) => String(n).padStart(2, '0')
const formatDuration = (d) => `${d.days}일 ${pad(d.hours)}시간 ${pad(d.minutes)}분 ${pad(d.seconds)}초`

/** 지금 보이는 메인 배너의 기간(startsAt ~ endsAt) 기준으로 경과·남은 시간을 보여줍니다. */
export default function VersionTimer({ startsAt, endsAt }) {
  const elapsedSinceStart = useLiveDuration(startsAt, 'elapsed')
  const remainingUntilEnd = useLiveDuration(endsAt, 'remaining')

  if (!startsAt && !endsAt) return null

  return (
    <div className="version-timer">
      <span className="version-timer__row">
        버전 시작 <strong>{elapsedSinceStart ? formatDuration(elapsedSinceStart) : '시작 전'}</strong>
      </span>
      <span className="version-timer__row">
        패스 종료 <strong>{remainingUntilEnd ? formatDuration(remainingUntilEnd) : '종료됨'}</strong>
      </span>
    </div>
  )
}
