import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motionOff } from './motion'

const MOVE_MS = 450
const EXIT_MS = 260
const MAX_SLIDE = 120 // 이보다 먼 이동은 미끄러지는 대신 흐려졌다 나타납니다(px)
const reduceMotion = () => motionOff()

/**
 * 목록 순서가 바뀌면 각 행이 새 자리로 미끄러져 가고(FLIP), 목록에서 빠진 행은 잠깐 남아 흐려지며 사라집니다.
 * items: 지금 보여 줄 목록, getKey: 행 키. 반환: { rendered: [{ item, exiting }], listRef }
 * 행 요소에는 data-flip-key={키}를 달아야 합니다.
 */
export function useFlipList(items, getKey) {
  const listRef = useRef(null)
  const [rendered, setRendered] = useState(() => items.map((item) => ({ item, exiting: false })))
  const prevTops = useRef(new Map())

  // 빠진 행은 원래 자리 근처에 "사라지는 중"으로 잠깐 남겨 둡니다.
  useEffect(() => {
    const keys = new Set(items.map(getKey))
    setRendered((prev) => {
      const next = items.map((item) => ({ item, exiting: false }))
      if (reduceMotion()) return next
      prev.forEach((row, i) => {
        if (!keys.has(getKey(row.item))) next.splice(Math.min(i, next.length), 0, { item: row.item, exiting: true })
      })
      return next
    })
    const timer = setTimeout(() => setRendered((prev) => prev.filter((r) => !r.exiting)), EXIT_MS)
    return () => clearTimeout(timer)
  }, [items]) // eslint-disable-line react-hooks/exhaustive-deps

  // 그린 직후: 이전 위치와 비교해 차이만큼 되돌려 놓고 0으로 움직입니다. offsetTop은 transform의 영향을 받지 않습니다.
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const tops = new Map()
    for (const el of list.querySelectorAll('[data-flip-key]')) {
      const key = el.dataset.flipKey
      tops.set(key, el.offsetTop)
      const before = prevTops.current.get(key)
      const delta = before === undefined ? 0 : before - el.offsetTop
      if (delta && !reduceMotion() && el.animate) {
        // 먼 거리를 그대로 미끄러지면 목록 밖까지 휩쓸고 지나가서, 최대 MAX_SLIDE만 미끄러지고 대신 흐려졌다 나타납니다.
        const far = Math.abs(delta) > MAX_SLIDE
        const from = far ? Math.sign(delta) * MAX_SLIDE : delta
        el.animate(
          [
            { transform: `translateY(${from}px)`, opacity: far ? 0 : 1 },
            { transform: 'translateY(0)', opacity: 1 },
          ],
          {
            duration: MOVE_MS,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)', // 튀지 않고 부드럽게 멈춥니다
            composite: 'add',
          },
        )
      }
    }
    prevTops.current = tops
  }, [rendered])

  return { rendered, listRef }
}
