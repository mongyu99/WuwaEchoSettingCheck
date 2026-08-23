import './SideNav.css'

export default function SideNav({ currentPage, onGoHome, onGoToCharacterList }) {
  return (
    <nav className="side-nav">
      <button className="side-nav__brand" onClick={onGoHome}>
        ECHO CHECK
      </button>
      <ul className="side-nav__list">
        <li>
          <button
            className={`side-nav__link ${currentPage === 'home' ? 'side-nav__link--active' : ''}`}
            onClick={onGoHome}
          >
            홈
          </button>
        </li>
        <li>
          <button
            className={`side-nav__link ${currentPage === 'characters' ? 'side-nav__link--active' : ''}`}
            onClick={onGoToCharacterList}
          >
            캐릭터 빌드 체크
          </button>
        </li>
        <li>
          <button className="side-nav__link">
            패치노트
          </button>
        </li>
        <li>
          <span className="side-nav__link side-nav__link--disabled">
            이벤트 캘린더
            <span className="side-nav__badge">준비중</span>
          </span>
        </li>
      </ul>
    </nav>
  )
}
