import AuthPanel from './AuthPanel'
import './TopNav.css'

export default function TopNav({ onGoHome, theme, onToggleTheme, characterData, onLoadCloudData }) {
  const isDark = theme === 'dark'

  return (
    <div className="top-nav">
      <button className="top-nav__brand" onClick={onGoHome}>
        명체크
      </button>
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
