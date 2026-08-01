import { useEffect, useState } from 'react'
import './SidePanel.css'

const PANEL_WIDTH = 380
const GAP = 10
const EDGE_MARGIN = 12

// 화면 가운데 뜨는 팝업이 아니라, 트리거 버튼(anchorRect) 바로 오른쪽에서 튀어나왔다가 다시
// 그 버튼 쪽으로 접혀 들어가는 패널입니다. 열고 닫힐 때 접히는 애니메이션이 재생되도록, open이
// false가 돼도 바로 사라지지 않고(한 번 열린 뒤로는 계속 DOM에 남아) CSS 클래스만 토글합니다.
export default function SidePanel({ open, title, onClose, children, anchorRect }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  if (!mounted) return null

  const top = anchorRect ? Math.max(EDGE_MARGIN, Math.min(anchorRect.top, window.innerHeight - EDGE_MARGIN - 80)) : undefined
  const style = anchorRect
    ? {
        top,
        left: Math.min(anchorRect.right + GAP, window.innerWidth - PANEL_WIDTH - EDGE_MARGIN),
        maxHeight: `calc(100vh - ${top}px - ${EDGE_MARGIN}px)`,
      }
    : undefined

  return (
    <div className={`side-panel ${open ? 'is-open' : ''}`} role="dialog">
      {open && <div className="side-panel__backdrop" onClick={onClose} />}
      <div className="side-panel__card" style={style}>
        <div className="side-panel__head">
          <h3>{title}</h3>
          <button className="side-panel__close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="side-panel__body">{children}</div>
      </div>
    </div>
  )
}
