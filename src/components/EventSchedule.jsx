import { useEffect, useState } from 'react'
import { fetchEvents } from '../utils/api'
import { formatMonthDay, daysRemaining } from '../utils/eventDates'
import './EventSchedule.css'

/** 홈용 이벤트 일정. 진행 중인 이벤트를 마감이 가까운 순으로 보여줍니다. */
export default function EventSchedule() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchEvents()
      .then((result) => {
        if (cancelled) return
        const ongoing = result
          .filter((e) => daysRemaining(e.endsAt) !== null)
          .sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt))
        setEvents(ongoing)
      })
      .catch(() => !cancelled && setEvents([]))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="event-schedule__empty">불러오는 중...</p>
  if (events.length === 0) return <p className="event-schedule__empty">진행 중인 이벤트가 없어요.</p>

  return (
    <ul className="event-schedule__list">
      {events.map((event) => {
        const Tag = event.url ? 'a' : 'div'
        return (
          <li key={event.id}>
            <Tag
              className="event-schedule__item"
              {...(event.url ? { href: event.url, target: '_blank', rel: 'noreferrer' } : {})}
            >
              <span className="event-schedule__badge">D-{daysRemaining(event.endsAt)}</span>
              <span className="event-schedule__title">{event.title}</span>
              <span className="event-schedule__date">
                {formatMonthDay(event.startsAt)} ~ {formatMonthDay(event.endsAt)}
              </span>
            </Tag>
          </li>
        )
      })}
    </ul>
  )
}
