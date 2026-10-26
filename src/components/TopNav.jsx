import AuthPanel from './AuthPanel'
import './TopNav.css'

// 상단바 메뉴. 왼쪽 사이드바 대신 모든 화면에서 같은 위치로 바로 이동합니다.
const MENU = [
  { page: 'home', label: '홈', handler: 'onGoHome' },
  { page: 'characters', label: '캐릭터 빌드 체크', handler: 'onGoToCharacterList' },
  { page: 'patchnotes', label: '패치노트', handler: 'onGoToPatchNotes' },
  { page: 'events', label: '이벤트 캘린더', handler: 'onGoToEventCalendar' },
]

export default function TopNav({ currentPage, theme, onToggleTheme, characterData, onLoadCloudData, ...handlers }) {
  const isDark = theme === 'dark'

  return (
    <div className="top-nav">
      <button className="top-nav__brand" onClick={handlers.onGoHome}>
        명체크
      </button>
      <nav className="top-nav__menu" aria-label="주요 메뉴">
        {MENU.map((item) => (
          <button
            key={item.page}
            className={`top-nav__link ${currentPage === item.page ? 'top-nav__link--active' : ''}`}
            aria-current={currentPage === item.page ? 'page' : undefined}
            onClick={handlers[item.handler]}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="top-nav__right">
        <button
          className={`theme-switch ${isDark ? 'theme-switch--dark' : 'theme-switch--light'}`}
          onClick={onToggleTheme}
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? '화이트 테마로 전환' : '블랙 테마로 전환'}
        >
          <span className="theme-switch__icon theme-switch__icon--sun">☀️</span>
          <span className="theme-switch__icon theme-switch__icon--moon">🌙</span>
          <span className="theme-switch__knob" />
        </button>
        <AuthPanel characterData={characterData} onLoadCloudData={onLoadCloudData} />
      </div>
    </div>
  )
}
