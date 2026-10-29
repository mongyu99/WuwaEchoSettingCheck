import { useState } from 'react'
import './MobileSection.css'

/**
 * 모바일에서만 접고 펼치는 섹션입니다. 제목 줄을 누르면 내용이 펼쳐지고, 다시 누르면 접힙니다.
 * PC에서는 감싼 요소가 레이아웃에 끼지 않아서(display: contents) 원래 화면 그대로 보입니다.
 * 섹션 안에 원래 있던 제목은 .mobile-section__heading 을 붙이면 모바일에서만 숨겨집니다(제목 줄과 중복).
 *
 * summary: 접혀 있을 때 제목 옆에 보여줄 요약(예: 고른 무기 이름)
 * card: 바깥 카드가 없는 섹션이면 true. 모바일에서 섹션 자체를 카드로 그립니다.
 * open / onToggle: 여러 섹션 중 하나만 펼치려면(아코디언) 바깥에서 상태를 넘깁니다. 없으면 각자 따로 열고 닫습니다.
 */
export default function MobileSection({ title, summary, defaultOpen = false, card = false, open: openProp, onToggle, children }) {
  const [openState, setOpenState] = useState(defaultOpen)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : openState
  const toggle = () => (controlled ? onToggle?.() : setOpenState((o) => !o))
  return (
    <div
      className={`mobile-section ${open ? 'mobile-section--open' : ''} ${card ? 'mobile-section--card' : ''}`}
    >
      <button type="button" className="mobile-section__toggle" aria-expanded={open} onClick={toggle}>
        <span className="mobile-section__title">{title}</span>
        {summary && <span className="mobile-section__summary">{summary}</span>}
        <span className="mobile-section__chevron" aria-hidden="true" />
      </button>
      {/* body → inner → content 3겹: 높이 애니메이션(grid 0fr↔1fr)이 여백까지 같이 줄이려면 여백을 맨 안쪽에 둬야 합니다. */}
      <div className="mobile-section__body">
        <div className="mobile-section__inner">
          <div className="mobile-section__content">{children}</div>
        </div>
      </div>
    </div>
  )
}
