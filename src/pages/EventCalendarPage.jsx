import { EVENTS } from '../config/eventCalendar'
import './EventCalendarPage.css'

function formatEndDate(endsAt) {
  const d = new Date(endsAt)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 남은 일수는 "오늘부터 종료일까지 며칠 남았는지"를 보여주는 용도라 초 단위 실시간 카운트다운
// 대신 날짜 단위로만 올림해서 계산합니다(예: 23시간 남아도 D-1로 표시).
function daysRemaining(endsAt) {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return null
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default function EventCalendarPage() {
  return (
    <section className="event-calendar">
      <header className="event-calendar__head">
        <span className="uploader__eyebrow">이벤트 캘린더</span>
        <h2>진행 중인 이벤트</h2>
      </header>

      {EVENTS.length === 0 ? (
        <p className="uploader__hint">등록된 이벤트가 없어요.</p>
      ) : (
        <div className="event-calendar__grid">
          {EVENTS.map((event) => {
            const remaining = daysRemaining(event.endsAt)
            return (
              <a
                key={event.id}
                className="event-card"
                href={event.url}
                target={event.url ? '_blank' : undefined}
                rel={event.url ? 'noreferrer' : undefined}
              >
                <div className="event-card__image-wrap">
                  {event.image ? (
                    <img className="event-card__image" src={event.image} alt={event.title} />
                  ) : (
                    <div className="event-card__image event-card__image--empty" />
                  )}
                  <span className={`event-card__badge ${remaining === null ? 'event-card__badge--ended' : ''}`}>
                    {remaining === null ? '종료됨' : `D-${remaining}`}
                  </span>
                </div>
                <div className="event-card__body">
                  <p className="event-card__title">{event.title}</p>
                  <p className="event-card__date">{formatEndDate(event.endsAt)}까지</p>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </section>
  )
}
