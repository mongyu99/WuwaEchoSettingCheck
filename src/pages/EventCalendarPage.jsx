import { useEffect, useState } from 'react'
import { assetPath } from '../config/assetPath'
import { fetchEvents } from '../utils/api'
import { formatDate, daysRemaining } from '../utils/eventDates'
import './EventCalendarPage.css'

export default function EventCalendarPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchEvents()
      .then((result) => {
        if (!cancelled) setEvents(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '이벤트를 불러오는 데 실패했어요.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 끝난 이벤트는 아래 "지난 이벤트"로 따로 모읍니다. 지난 이벤트는 최근에 끝난 것부터 보여줍니다.
  const current = events.filter((e) => daysRemaining(e.endsAt) !== null)
  const past = events
    .filter((e) => daysRemaining(e.endsAt) === null)
    .sort((a, b) => new Date(b.endsAt) - new Date(a.endsAt))

  const renderCard = (event, i) => {
    const remaining = daysRemaining(event.endsAt)
    return (
      <a
        key={event.id}
        className="event-card"
        // --i: 위에서부터 주르륵 차례로 등장시키기 위한 번호
        style={{ '--i': i }}
        href={event.url}
        target={event.url ? '_blank' : undefined}
        rel={event.url ? 'noreferrer' : undefined}
      >
        <div className="event-card__image-wrap">
          {event.image ? (
            <img className="event-card__image" src={assetPath(event.image)} alt={event.title} />
          ) : (
            <div className="event-card__image event-card__image--empty" />
          )}
          {event.upcoming && remaining !== null ? (
            <span className="upcoming-badge event-card__upcoming">예정</span>
          ) : (
            <span className={`event-card__badge ${remaining === null ? 'event-card__badge--ended' : ''}`}>
              {remaining === null ? '종료됨' : `D-${remaining}`}
            </span>
          )}
        </div>
        <div className="event-card__body">
          <p className="event-card__title">{event.title}</p>
          <p className="event-card__date">{formatDate(event.endsAt)}까지</p>
        </div>
      </a>
    )
  }

  return (
    <section className="event-calendar">
      <header className="event-calendar__head">
        <span className="uploader__eyebrow">이벤트 캘린더</span>
        <h2>진행 중인 이벤트</h2>
      </header>

      {loading && <p className="uploader__hint">불러오는 중...</p>}

      {!loading && error && <p className="uploader__hint">{error}</p>}

      {!loading && !error && events.length === 0 && <p className="uploader__hint">등록된 이벤트가 없어요.</p>}

      {!loading && !error && events.length > 0 && (
        <>
          {current.length === 0 ? (
            <p className="uploader__hint">진행 중인 이벤트가 없어요.</p>
          ) : (
            <div className="event-calendar__grid">{current.map(renderCard)}</div>
          )}

          {past.length > 0 && (
            <>
              <h3 className="event-calendar__section">지난 이벤트</h3>
              <div className="event-calendar__grid event-calendar__grid--past">{past.map(renderCard)}</div>
            </>
          )}
        </>
      )}
    </section>
  )
}
