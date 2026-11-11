import { useEffect, useState } from 'react'
import { fetchEvents } from '../utils/api'
import { formatMonthDay, daysRemaining } from '../utils/eventDates'
import { buildTimeline, timelineTicks } from '../utils/eventTimeline'
import './EventNotePage.css'

/** 이벤트 노트: 진행 중·예정 이벤트의 기간을 막대로 그려 한눈에 보여줍니다. 데이터는 관리자 페이지의 이벤트와 같습니다. */
export default function EventNotePage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchEvents()
      .then((result) => !cancelled && setEvents(result))
      .catch((err) => !cancelled && setError(err.message || '이벤트를 불러오는 데 실패했어요.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const timeline = buildTimeline(events)

  return (
    <section className="event-note">
      <header>
        <span className="uploader__eyebrow">이벤트 노트</span>
        <h2>이벤트 일정 한눈에 보기</h2>
      </header>

      {loading && <p className="uploader__hint">불러오는 중...</p>}
      {!loading && error && <p className="uploader__hint">{error}</p>}
      {!loading && !error && !timeline && <p className="uploader__hint">진행 중이거나 예정된 이벤트가 없어요.</p>}

      {timeline && (
        <div className="event-note__chart">
          <div className="event-note__scale">
            {timelineTicks(timeline).map((tick) => (
              <span key={tick.time} style={{ left: `${tick.left}%` }}>
                {formatMonthDay(new Date(tick.time).toISOString())}
              </span>
            ))}
          </div>

          <ul className="event-note__rows">
            {timeline.todayLeft !== null && (
              <li className="event-note__today" style={{ left: `${timeline.todayLeft}%` }} aria-hidden="true">
                <span>오늘</span>
              </li>
            )}
            {timeline.rows.map(({ event, left, width }, i) => {
              const upcoming = event.upcoming || new Date(event.startsAt).getTime() > Date.now()
              const remaining = daysRemaining(event.endsAt)
              return (
                <li key={event.id} className="event-note__row" style={{ '--i': i }}>
                  <a
                    className={`event-note__bar ${upcoming ? 'event-note__bar--upcoming' : ''}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    href={event.url || undefined}
                    target={event.url ? '_blank' : undefined}
                    rel={event.url ? 'noreferrer' : undefined}
                    title={`${event.title} (${formatMonthDay(event.startsAt)} ~ ${formatMonthDay(event.endsAt)})`}
                  >
                    <strong>{event.title}</strong>
                    <small>
                      {formatMonthDay(event.startsAt)} ~ {formatMonthDay(event.endsAt)}
                      {upcoming ? ' · 예정' : remaining !== null && ` · D-${remaining}`}
                    </small>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
