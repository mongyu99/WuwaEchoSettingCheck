import { useLiveDuration } from '../utils/useLiveDuration'
import './VersionTimer.css'

// 시·분·초를 두 자리로 맞춰서, 숫자가 바뀌어도 알약 폭이 흔들리지 않게 합니다.
const pad = (n) => String(n).padStart(2, '0')
const formatDuration = (d) => `${d.days}일 ${pad(d.hours)}시간 ${pad(d.minutes)}분 ${pad(d.seconds)}초`
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
/** 2026-11-12T03:00Z → "11.12 (목) 12:00" (접속 기기 시간대 기준) */
const formatDateTime = (iso) => {
  const d = new Date(iso)
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${WEEKDAYS[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 지금 보이는 메인 배너의 기간(startsAt ~ endsAt) 기준으로 경과·남은 시간을 보여줍니다.
 * 아직 시작 전인 배너(다음 버전)는 타이머 대신 시작·종료 일시를 보여줍니다.
 */
export default function VersionTimer({ startsAt, endsAt }) {
  const elapsedSinceStart = useLiveDuration(startsAt, 'elapsed')
  const remainingUntilEnd = useLiveDuration(endsAt, 'remaining')
  const notStarted = !!startsAt && new Date(startsAt).getTime() > Date.now()

  if (!startsAt && !endsAt) return null

  return (
    <div className="version-timer">
      <span className="version-timer__row">
        버전 시작{' '}
        <strong>{notStarted ? formatDateTime(startsAt) : elapsedSinceStart ? formatDuration(elapsedSinceStart) : '시작 전'}</strong>
      </span>
      <span className="version-timer__row">
        패스 종료{' '}
        <strong>{notStarted ? formatDateTime(endsAt) : remainingUntilEnd ? formatDuration(remainingUntilEnd) : '종료됨'}</strong>
      </span>
    </div>
  )
}
