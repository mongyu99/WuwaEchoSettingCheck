// 사진이 한 위치에서 튀어나와 포물선을 그리며 다른 요소로 날아가 "쏙" 들어가는 효과입니다.
// 화면 위(fixed)에 잠깐 복제 이미지를 띄워 움직인 뒤 지웁니다. 실제 목록은 건드리지 않습니다.
import { jelly } from './jelly'

const DURATION_MS = 750

/**
 * from: 시작 위치(DOMRect 비슷한 { left, top, width, height })
 * to: 도착할 요소 또는 위치({ left, top, width, height }). 요소면 도착 후 젤리처럼 흔듭니다(onLand가 있으면 대신 호출).
 */
export function flyTo(src, from, toTarget, { onLand } = {}) {
  const toEl = toTarget instanceof Element ? toTarget : null
  if (!src || !toTarget || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    onLand?.()
    return
  }
  const to = toEl ? toEl.getBoundingClientRect() : toTarget
  const size = Math.min(from.width, from.height, 120)
  const startX = from.left + from.width / 2 - size / 2
  const startY = from.top + from.height / 2 - size / 2
  // 도착 크기는 출발 크기보다 커지지 않게 합니다(큰 요소로 날아가도 사진이 부풀지 않게).
  const endScale = Math.min(Math.max(to.width / size, 0.2), 1)
  const dx = to.left + to.width / 2 - (startX + size / 2)
  const dy = to.top + to.height / 2 - (startY + size / 2)
  // 중간 지점을 위로 띄워 포물선처럼 날아가게 합니다.
  const lift = Math.min(160, Math.abs(dx) * 0.35 + 40)

  const img = document.createElement('img')
  img.src = src
  img.alt = ''
  Object.assign(img.style, {
    position: 'fixed',
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    borderRadius: '14px',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 0 0 2px var(--accent-wave)',
    zIndex: 9999,
    pointerEvents: 'none',
  })
  document.body.appendChild(img)

  const anim = img.animate(
    [
      // 공유 화면에서 "톡" 튀어나오고
      { transform: 'translate(0, 0) scale(0.6)', opacity: 0, offset: 0 },
      { transform: 'translate(0, -14px) scale(1.12)', opacity: 1, offset: 0.18 },
      // 포물선 꼭짓점
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - lift}px) scale(${(1 + endScale) / 2}) rotate(-6deg)`, offset: 0.55 },
      // 목록으로 쏙
      { transform: `translate(${dx}px, ${dy}px) scale(${endScale}) rotate(0deg)`, opacity: 1, offset: 0.92 },
      { transform: `translate(${dx}px, ${dy}px) scale(${endScale * 0.9})`, opacity: 0, offset: 1 },
    ],
    { duration: DURATION_MS, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' },
  )
  anim.onfinish = () => {
    img.remove()
    if (onLand) onLand()
    else if (toEl) jelly(toEl)
  }
}
