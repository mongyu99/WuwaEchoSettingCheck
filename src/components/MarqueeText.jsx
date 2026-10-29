import { useEffect, useRef, useState } from 'react'
import './MarqueeText.css'

// 모든 글이 같은 시간(MOVE_MS) 동안 한 바퀴를 돌아서 동시에 출발하고 동시에 도착합니다.
// 그래서 긴 글은 빠르게, 짧은 글은 느리게 흐릅니다. 한 바퀴마다 처음 위치에서 PAUSE_MS 만큼 멈춥니다.
const MOVE_MS = 8000
const PAUSE_MS = 1500
// 글 끝과 뒤에 이어 붙는 복사본 사이 간격 (MarqueeText.css .marquee__copy 의 margin-left 와 같아야 함)
const GAP_PX = 48

/**
 * 칸보다 긴 글자만 전광판처럼 왼쪽으로 흘려 보여줍니다. 글 뒤에 복사본을 붙여 두고 글 하나 + 간격만큼
 * 이동한 뒤 처음으로 되돌리면, 복사본이 원래 글 자리에 와 있어서 끊김 없이 이어집니다.
 * 칸에 다 들어가면 그대로 둡니다. 칸 폭이나 글자 폭이 바뀌면(창 크기 변경, 글꼴 로딩) 다시 잽니다.
 */
export default function MarqueeText({ children, className = '' }) {
  const boxRef = useRef(null)
  const trackRef = useRef(null)
  const textRef = useRef(null)
  const [textWidth, setTextWidth] = useState(0)
  const [scrolling, setScrolling] = useState(false)

  useEffect(() => {
    const box = boxRef.current
    const text = textRef.current
    if (!box || !text) return undefined
    const measure = () => {
      setTextWidth(text.offsetWidth)
      setScrolling(text.offsetWidth > box.clientWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    observer.observe(text)
    return () => observer.disconnect()
  }, [children])

  // 이동 거리가 글마다 달라서 CSS keyframes 대신 Web Animations API로 만듭니다.
  useEffect(() => {
    const track = trackRef.current
    if (!track || !scrolling || !track.animate) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const distance = textWidth + GAP_PX
    const totalMs = PAUSE_MS + MOVE_MS
    const animation = track.animate(
      [
        { transform: 'translateX(0)', offset: 0 },
        { transform: 'translateX(0)', offset: PAUSE_MS / totalMs },
        { transform: `translateX(-${distance}px)`, offset: 1 },
      ],
      { duration: totalMs, iterations: Infinity, easing: 'linear' },
    )
    // 시작 시각을 페이지 기준 0으로 맞춥니다. 길이가 모두 같으니, 늦게 그려진 줄도 다른 줄과 박자가 같아집니다.
    animation.startTime = 0
    return () => animation.cancel()
  }, [scrolling, textWidth])

  return (
    <span
      ref={boxRef}
      className={`marquee ${scrolling ? 'marquee--scrolling' : ''} ${className}`}
      title={scrolling ? String(children) : undefined}
    >
      <span ref={trackRef} className="marquee__track">
        <span ref={textRef} className="marquee__text">
          {children}
        </span>
        {scrolling && (
          <span className="marquee__text marquee__copy" aria-hidden="true">
            {children}
          </span>
        )}
      </span>
    </span>
  )
}
