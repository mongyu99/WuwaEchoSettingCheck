import { useEffect, useState } from 'react'
import { fetchEvents } from '../utils/api'
import { assetPath } from '../config/assetPath'
import { formatMonthDay, daysRemaining } from '../utils/eventDates'
import './CommunityEvents.css'

/** 홈용 커뮤니티 참여형 이벤트(SNS·공모전 등) 배너 줄. 진행 중인 것이 없으면 통째로 숨깁니다. */
export default function CommunityEvents() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchEvents()
      .then((result) => {
        if (cancelled) return
        setEvents(
          result
            .filter((e) => e.community && daysRemaining(e.endsAt) !== null)
            .sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt)),
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (events.length === 0) return null

  return (
    <section className="home-page__panel">
      <h4 className="home-page__panel-title">커뮤니티 이벤트</h4>
      <ul className="community-events">
        {events.map((event) => {
          const Tag = event.url ? 'a' : 'div'
          return (
            <li key={event.id}>
              <Tag
                className="community-events__card"
                {...(event.url ? { href: event.url, target: '_blank', rel: 'noreferrer' } : {})}
              >
                <span className="community-events__image">
                  {event.image && <img src={assetPath(event.image)} alt="" loading="lazy" />}
                  {event.upcoming ? (
                    <span className="upcoming-badge community-events__badge">예정</span>
                  ) : (
                    <span className="community-events__badge community-events__badge--dday">
                      D-{daysRemaining(event.endsAt)}
                    </span>
                  )}
                </span>
                <span className="community-events__title">{event.title}</span>
                <span className="community-events__date">
                  {formatMonthDay(event.startsAt)} ~ {formatMonthDay(event.endsAt)}
                </span>
              </Tag>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
