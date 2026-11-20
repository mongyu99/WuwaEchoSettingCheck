import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getEchoSet } from '../config/echoSets'
import { assetPath } from '../config/assetPath'
import { gradeOf } from '../utils/echoScore'
import './BagPipPanel.css'

// 문서 PiP(Document Picture-in-Picture): 웹 화면 일부를 다른 프로그램(게임) 위에 항상 떠 있는 작은 창으로 띄웁니다.
// 크롬·엣지만 지원합니다. 게임이 전체 화면 독점 모드면 가려지고, 창 모드·테두리 없는 창 모드에서 위에 보입니다.
export const pipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window

const RECENT_COUNT = 5

/** 지금 페이지의 CSS를 PiP 창에 그대로 복사합니다(PiP 창은 빈 문서로 열립니다). */
function copyStyles(target) {
  for (const sheet of document.styleSheets) {
    try {
      const style = target.document.createElement('style')
      style.textContent = [...sheet.cssRules].map((r) => r.cssText).join('\n')
      target.document.head.appendChild(style)
    } catch {
      // 다른 주소의 CSS(구글 폰트 등)는 규칙을 못 읽으므로 링크로 붙입니다.
      if (sheet.href) {
        const link = target.document.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        target.document.head.appendChild(link)
      }
    }
  }
  // 다크 모드·애니메이션 끄기 설정도 같이 맞춥니다.
  for (const attr of ['data-theme', 'data-motion']) {
    const value = document.documentElement.getAttribute(attr)
    if (value) target.document.documentElement.setAttribute(attr, value)
  }
}

/** PiP 창을 열고 닫는 상태. 열린 창(window)이나 null을 돌려줍니다. */
export function usePipWindow() {
  const [pipWindow, setPipWindow] = useState(null)

  const open = async () => {
    if (!pipSupported || pipWindow) return
    try {
      const win = await window.documentPictureInPicture.requestWindow({ width: 320, height: 440 })
      win.document.title = '명체크 · 가방 스캔'
      copyStyles(win)
      win.addEventListener('pagehide', () => setPipWindow(null))
      setPipWindow(win)
    } catch (e) {
      console.error('PiP 창을 열지 못했어요.', e)
    }
  }
  const close = () => pipWindow?.close()

  // 페이지를 떠나면 PiP 창도 닫습니다.
  useEffect(() => () => pipWindow?.close(), [pipWindow])

  return { pipWindow, open, close }
}

/** PiP 창 안의 내용: 저장/건너뜀 반짝임, 개수, 최근 저장된 에코. */
export default function BagPipPanel({ pipWindow, flash, items, stats, sharing }) {
  if (!pipWindow) return null
  const recent = items.slice(-RECENT_COUNT).reverse()

  return createPortal(
    <div className="bag-pip">
      <div className="bag-pip__status">
        <span className={`bag-pip__live ${sharing ? 'bag-pip__live--on' : ''}`}>{sharing ? '● 인식 중' : '공유 꺼짐'}</span>
        {flash.n > 0 && (
          <span key={flash.n} className={`bag-pip__flash ${flash.kind === 'dup' ? 'bag-pip__flash--dup' : ''}`}>
            {flash.kind === 'dup' ? '이미 있는 에코 · 건너뜀' : '✓ 저장됨'}
          </span>
        )}
      </div>

      <dl className="bag-pip__counts">
        <div>
          <dt>인식</dt>
          <dd>{items.length.toLocaleString()}</dd>
        </div>
        <div>
          <dt>중복</dt>
          <dd>{stats.duplicate.toLocaleString()}</dd>
        </div>
        <div>
          <dt>대기</dt>
          <dd>{stats.pending}</dd>
        </div>
      </dl>

      <ul className="bag-pip__list">
        {recent.length === 0 && <li className="bag-pip__empty">가방에서 에코를 넘기면 여기에 쌓여요.</li>}
        {recent.map((item) => {
          const grade = gradeOf(item.score * 5)
          return (
            <li key={item.key} className="bag-pip__item">
              {item.thumbnail ? <img className="bag-pip__thumb" src={item.thumbnail} alt="" /> : <span className="bag-pip__thumb" />}
              <div className="bag-pip__info">
                <strong>{getEchoSet(item.setId)?.name ?? '세트 모름'}</strong>
                <span>
                  {item.main?.label ?? '메인 모름'} · 옵션 {item.subStats.length}개
                </span>
              </div>
              <img className="bag-pip__grade" src={assetPath(`grades/${grade.icon}.png`)} alt={grade.label} />
            </li>
          )
        })}
      </ul>
    </div>,
    pipWindow.document.body,
  )
}
