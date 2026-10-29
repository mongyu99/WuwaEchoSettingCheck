import { useEffect } from 'react'

// 팝업이 여러 개 겹쳐 열려도, 마지막 팝업이 닫힐 때만 잠금을 풉니다.
let lockCount = 0
let saved = null

/**
 * active 동안 페이지(뒤 배경) 스크롤을 잠급니다. 팝업 안쪽 스크롤은 그대로 됩니다.
 * PC에서는 스크롤바가 사라지며 화면이 옆으로 밀리지 않게 그 폭만큼 오른쪽 여백을 채웁니다.
 */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined
    const root = document.documentElement
    if (lockCount === 0) {
      saved = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
      const scrollbarWidth = window.innerWidth - root.clientWidth
      root.style.overflow = 'hidden'
      if (scrollbarWidth > 0) root.style.paddingRight = `${scrollbarWidth}px`
    }
    lockCount += 1
    return () => {
      lockCount -= 1
      if (lockCount === 0 && saved) {
        root.style.overflow = saved.overflow
        root.style.paddingRight = saved.paddingRight
        saved = null
      }
    }
  }, [active])
}
