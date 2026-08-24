import { useState } from 'react'
import './SideNav.css'

export default function SideNav({
  currentPage,
  onGoHome,
  onGoToCharacterList,
  onGoToPatchNotes,
  onGoToEventCalendar,
}) {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  const withClose = (handler) => () => {
    closeMenu()
    handler()
  }

  const handleGoHome = withClose(onGoHome)
  const handleGoToCharacterList = withClose(onGoToCharacterList)
  const handleGoToPatchNotes = withClose(onGoToPatchNotes)
  const handleGoToEventCalendar = withClose(onGoToEventCalendar)

  return (
    <nav className={`side-nav ${isOpen ? 'side-nav--open' : ''}`}>
      <div className="side-nav__header">
        <button className="side-nav__brand" onClick={handleGoHome}>
          ECHO CHECK
        </button>
        <button
          type="button"
          className="side-nav__toggle"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls="site-nav-list"
          aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          <span className="side-nav__toggle-bar" />
          <span className="side-nav__toggle-bar" />
          <span className="side-nav__toggle-bar" />
        </button>
      </div>
      <ul id="site-nav-list" className="side-nav__list">
        <li>
          <button
            className={`side-nav__link ${currentPage === 'home' ? 'side-nav__link--active' : ''}`}
            onClick={handleGoHome}
          >
            홈
          </button>
        </li>
        <li>
          <button
            className={`side-nav__link ${currentPage === 'characters' ? 'side-nav__link--active' : ''}`}
            onClick={handleGoToCharacterList}
          >
            캐릭터 빌드 체크
          </button>
        </li>
        <li>
          <button
            className={`side-nav__link ${currentPage === 'patchnotes' ? 'side-nav__link--active' : ''}`}
            onClick={handleGoToPatchNotes}
          >
            패치노트
          </button>
        </li>
        <li>
          <button
            className={`side-nav__link ${currentPage === 'events' ? 'side-nav__link--active' : ''}`}
            onClick={handleGoToEventCalendar}
          >
            이벤트 캘린더
          </button>
        </li>
      </ul>
    </nav>
  )
}
