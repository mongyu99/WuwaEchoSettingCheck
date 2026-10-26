import { useEffect, useRef, useState } from 'react'
import './XTimeline.css'

const WIDGET_SRC = 'https://platform.twitter.com/widgets.js'

// X 임베드 스크립트는 한 번만 받아서 여러 번 재사용합니다.
let widgetPromise
function loadWidgets() {
  if (window.twttr?.widgets) return Promise.resolve(window.twttr)
  widgetPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = WIDGET_SRC
    script.async = true
    script.onload = () => (window.twttr?.widgets ? resolve(window.twttr) : reject(new Error('X 위젯 초기화 실패')))
    script.onerror = () => {
      widgetPromise = undefined
      reject(new Error('X 위젯 스크립트를 불러오지 못했어요'))
    }
    document.body.appendChild(script)
  })
  return widgetPromise
}

/**
 * X 공식 임베드 위젯으로 계정 타임라인을 보여줍니다. 위젯 영역은 숨기지 않고, 일정 시간이 지나도 iframe이
 * 생기지 않았을 때만(차단·네트워크 문제) 안내 문구를 띄웁니다. 아래 X 링크는 항상 남겨 둡니다.
 */
export default function XTimeline({ handle, theme }) {
  const containerRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | failed
  const profileUrl = `https://x.com/${handle}`

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    let cancelled = false
    setStatus('loading')

    // 실행마다 새 자리를 만들고 정리 때 통째로 떼어냅니다. 이전 실행(테마 변경, 개발 모드의 이중 실행)의
    // 위젯이 늦게 그려져도 떼어낸 자리에 그려져서 화면에 두 개가 겹치지 않습니다.
    const target = document.createElement('div')
    container.appendChild(target)

    // X 위젯은 iframe을 먼저 0×0·숨김으로 만들고, 안쪽 타임라인이 다 그려져야 보이게 바꿉니다.
    // 그래서 iframe이 있는지가 아니라 실제로 높이가 생겼는지로 성공을 판단합니다.
    const isVisible = () => (target.querySelector('iframe[id^="twitter-widget"]')?.offsetHeight ?? 0) > 0
    const markReady = () => !cancelled && isVisible() && setStatus('ready')
    const timeout = setTimeout(() => {
      if (!cancelled) setStatus(isVisible() ? 'ready' : 'failed')
    }, 8000)

    loadWidgets()
      .then((twttr) =>
        twttr.widgets.createTimeline({ sourceType: 'profile', screenName: handle }, target, {
          theme: theme === 'light' ? 'light' : 'dark',
          lang: 'ko',
          height: 720,
          chrome: 'noborders transparent',
          dnt: true,
        }),
      )
      .then(markReady)
      .catch(() => !cancelled && setStatus('failed'))

    return () => {
      cancelled = true
      clearTimeout(timeout)
      target.remove()
    }
  }, [handle, theme])

  return (
    <div className="x-timeline">
      <div ref={containerRef} className="x-timeline__embed" />
      {status === 'loading' && <p className="x-timeline__note">공식 소식을 불러오는 중…</p>}
      {status === 'failed' && (
        <p className="x-timeline__note">
          지금은 소식을 불러오지 못했어요. X에서 직접 확인해 주세요.
        </p>
      )}
      <a className="x-timeline__link" href={profileUrl} target="_blank" rel="noopener noreferrer">
        @{handle} X에서 보기 ↗
      </a>
    </div>
  )
}
