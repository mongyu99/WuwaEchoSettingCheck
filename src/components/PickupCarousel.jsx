import { useEffect, useMemo, useState } from 'react'
import { PICKUPS } from '../config/pickups'
import { formatMonthDay, daysRemaining } from '../utils/eventDates'
import './PickupCarousel.css'

const SLIDE_INTERVAL_MS = 4000

/**
 * 진행 중인 픽업을 끝없이 한 방향으로 넘기는 슬라이드입니다. 마지막 다음에 첫 장의 복제본을 붙여 두고,
 * 복제본에 도착하면 애니메이션 없이 진짜 첫 장으로 순간 이동해서 끊김 없이 이어지게 합니다.
 */
export default function PickupCarousel() {
  const pickups = useMemo(() => PICKUPS.filter((p) => daysRemaining(p.endsAt) !== null), [])
  const count = pickups.length
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (count <= 1 || paused) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = setInterval(() => {
      setAnimate(true)
      setIndex((i) => i + 1)
    }, SLIDE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [count, paused])

  // 복제본(index === count)에 도착하면 애니메이션을 끄고 0으로 되돌린 뒤, 다음 프레임에 다시 켭니다.
  const handleTransitionEnd = () => {
    if (index === count) {
      setAnimate(false)
      setIndex(0)
    }
  }

  useEffect(() => {
    if (animate) return undefined
    const frame = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(frame)
  }, [animate])

  const go = (delta) => {
    setAnimate(true)
    setIndex((i) => (((i % count) + delta) % count + count) % count)
  }

  if (count === 0) {
    return <p className="pickup__empty">등록된 픽업 일정이 없어요.</p>
  }

  const slides = count > 1 ? [...pickups, pickups[0]] : pickups
  const current = pickups[index % count]

  return (
    <div className="pickup" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="pickup__viewport">
        <div
          className={`pickup__track ${animate ? '' : 'pickup__track--instant'}`}
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((p, i) => (
            <div key={`${p.name}-${i}`} className="pickup__slide" aria-hidden={i % count !== index % count}>
              <img className="pickup__image" src={p.image} alt={`${p.name} 픽업`} />
              <div className="pickup__caption">
                <span className="pickup__name">{p.name}</span>
                <span className="pickup__period">
                  {formatMonthDay(p.startsAt)} ~ {formatMonthDay(p.endsAt)} · D-{daysRemaining(p.endsAt)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button className="pickup__arrow pickup__arrow--prev" onClick={() => go(-1)} aria-label="이전 픽업">
              ‹
            </button>
            <button className="pickup__arrow pickup__arrow--next" onClick={() => go(1)} aria-label="다음 픽업">
              ›
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="pickup__dots">
          {pickups.map((p, i) => (
            <button
              key={p.name}
              className={`pickup__dot ${i === index % count ? 'pickup__dot--active' : ''}`}
              onClick={() => {
                setAnimate(true)
                setIndex(i)
              }}
              aria-label={`${p.name} 픽업 보기`}
              aria-current={i === index % count ? 'true' : undefined}
            />
          ))}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {current.name} 픽업
      </span>
    </div>
  )
}
