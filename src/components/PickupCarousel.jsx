import { useEffect, useState } from 'react'
import { PICKUP_IMAGES } from '../config/pickups'
import { assetPath } from '../config/assetPath'
import { fetchPickups } from '../utils/api'
import './PickupCarousel.css'

const SLIDE_INTERVAL_MS = 4000

/**
 * 픽업 이미지를 끝없이 한 방향으로 넘기는 슬라이드입니다. 마지막 다음에 첫 장의 복제본을 붙여 두고,
 * 복제본에 도착하면 애니메이션 없이 진짜 첫 장으로 순간 이동해서 끊김 없이 이어지게 합니다.
 */
export default function PickupCarousel() {
  // 관리자 페이지에서 기간을 정해 활성화한 픽업 배너(/api/pickups). 조회가 실패하면 config의 로컬 이미지를 씁니다.
  const [images, setImages] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchPickups()
      .then((result) => {
        if (!cancelled) setImages(result.filter((p) => p.imagePath).map((p) => assetPath(p.imagePath)))
      })
      .catch(() => !cancelled && setImages(PICKUP_IMAGES))
    return () => {
      cancelled = true
    }
  }, [])

  const count = images?.length ?? 0
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

  if (images === null) {
    return <p className="pickup__empty">불러오는 중...</p>
  }

  if (count === 0) {
    return <p className="pickup__empty">등록된 픽업 일정이 없어요.</p>
  }

  const slides = count > 1 ? [...images, images[0]] : images

  return (
    <div className="pickup" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        className={`pickup__track ${animate ? '' : 'pickup__track--instant'}`}
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((src, i) => (
          <img
            key={`${src}-${i}`}
            className="pickup__image"
            src={src}
            alt={`픽업 일정 ${(i % count) + 1}`}
            aria-hidden={i === count}
          />
        ))}
      </div>

      {count > 1 && (
        <div className="pickup__dots" aria-label={`픽업 ${count}개 중 ${(index % count) + 1}번째`}>
          {images.map((src, i) => (
            <span key={src} className={`pickup__dot ${i === index % count ? 'pickup__dot--active' : ''}`} />
          ))}
        </div>
      )}
    </div>
  )
}
