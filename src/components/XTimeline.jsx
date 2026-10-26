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
 * X 공식 임베드 위젯으로 계정 타임라인을 보여줍니다. 로그인하지 않은 방문자에게는 X 정책상 비어 보이거나
 * 늦게 뜰 수 있어서, 일정 시간 안에 안 뜨면 X에서 직접 보는 링크만 남깁니다.
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
    container.innerHTML = ''

    const timeout = setTimeout(() => !cancelled && setStatus((s) => (s === 'loading' ? 'failed' : s)), 8000)

    loadWidgets()
      .then((twttr) =>
        twttr.widgets.createTimeline({ sourceType: 'profile', screenName: handle }, container, {
          theme: theme === 'light' ? 'light' : 'dark',
          lang: 'ko',
          height: 720,
          chrome: 'noborders transparent',
          dnt: true,
        }),
      )
      .then((el) => !cancelled && setStatus(el ? 'ready' : 'failed'))
      .catch(() => !cancelled && setStatus('failed'))

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [handle, theme])

  return (
    <div className="x-timeline">
      <div ref={containerRef} className="x-timeline__embed" hidden={status === 'failed'} />
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
