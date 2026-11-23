import AuthPanel from './AuthPanel'
import BackupPanel from './BackupPanel'
import { screenCaptureSupported } from './ScreenCapture'
import { useEffect, useState } from 'react'
import { applyMotion, loadMotion } from '../utils/motion'
import './TopNav.css'

// 상단바 메뉴. 왼쪽 사이드바 대신 모든 화면에서 같은 위치로 바로 이동합니다.
const MENU = [
  { page: 'home', label: '홈', handler: 'onGoHome' },
  { page: 'characters', label: '캐릭터 빌드 체크', handler: 'onGoToCharacterList' },
  // 에코 체크는 모바일에서도 캡쳐 인식(스크린샷 올리기)으로 쓸 수 있어서 항상 보여 줍니다.
  { page: 'live', label: '에코 체크', handler: 'onGoToLiveCheck' },
  // 아래는 화면 공유가 필요한 기능이라 모바일에서는 메뉴에 넣지 않습니다.
  ...(screenCaptureSupported ? [
        { page: 'bag', label: '에코 가방', handler: 'onGoToEchoBag' },
        // 가방 정리로 모은 에코로 캐릭터마다 5개 조합을 짜 줍니다(가방 정리와 같은 PC 전용 묶음).
        { page: 'recommend', label: '추천 세팅 - 베타', handler: 'onGoToRecommend' },
      ] : []),
  { page: 'events', label: '이벤트 캘린더', handler: 'onGoToEventCalendar' },
  { page: 'eventnote', label: '이벤트 노트', handler: 'onGoToEventNote' },
]

// 사이트 자체의 업데이트 기록이라 게임 메뉴와 떨어뜨려 오른쪽 끝(테마 스위치 앞)에 둡니다.
const GUIDE = { page: 'guide', label: '가이드', handler: 'onGoToGuide' }
const PATCH_NOTES = { page: 'patchnotes', label: '패치노트', handler: 'onGoToPatchNotes' }

export default function TopNav({ currentPage, theme, onToggleTheme, characterData, onLoadCloudData, ...handlers }) {
  const isDark = theme === 'dark'
  // 애니메이션 켜기/끄기(움직임이 싫은 사용자용). 이 기기에만 기억합니다.
  const [motionOn, setMotionOn] = useState(loadMotion)
  useEffect(() => applyMotion(motionOn), [motionOn])
  // 모바일: 메뉴와 오른쪽 설정을 왼쪽에서 나오는 서랍에 넣습니다(데스크톱에서는 서랍 없이 그대로 펼쳐 보입니다).
  const [drawerOpen, setDrawerOpen] = useState(false)
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])
  const go = (handler) => () => {
    setDrawerOpen(false)
    handlers[handler]?.()
  }

  return (
    <div className="top-nav">
      <button
        type="button"
        className={`top-nav__burger ${drawerOpen ? 'top-nav__burger--open' : ''}`}
        aria-label={drawerOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>
      <button className="top-nav__brand" onClick={go('onGoHome')}>
        명체크
      </button>
      {drawerOpen && <div className="top-nav__backdrop" onClick={() => setDrawerOpen(false)} />}
      <div className={`top-nav__drawer ${drawerOpen ? 'top-nav__drawer--open' : ''}`}>
      <nav className="top-nav__menu" aria-label="주요 메뉴">
        {MENU.map((item) => (
          <button
            key={item.page}
            className={`top-nav__link ${currentPage === item.page ? 'top-nav__link--active' : ''}`}
            aria-current={currentPage === item.page ? 'page' : undefined}
            onClick={go(item.handler)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="top-nav__right">
        <button
          className={`top-nav__link ${currentPage === GUIDE.page ? 'top-nav__link--active' : ''}`}
          aria-current={currentPage === GUIDE.page ? 'page' : undefined}
          onClick={go(GUIDE.handler)}
        >
          {GUIDE.label}
        </button>
        <BackupPanel characterData={characterData} onLoadData={onLoadCloudData} />
        <button
          className={`top-nav__link ${currentPage === PATCH_NOTES.page ? 'top-nav__link--active' : ''}`}
          aria-current={currentPage === PATCH_NOTES.page ? 'page' : undefined}
          onClick={go(PATCH_NOTES.handler)}
        >
          {PATCH_NOTES.label}
        </button>
        <AuthPanel characterData={characterData} onLoadCloudData={onLoadCloudData} />
      </div>
      </div>
      {/* 애니메이션·테마 스위치는 화면 폭과 상관없이 항상 상단바 오른쪽 끝에 둡니다(서랍에 넣지 않음). */}
      <div className="top-nav__toggles">
        <button
          className={`motion-switch ${motionOn ? 'motion-switch--on' : ''}`}
          onClick={() => setMotionOn((on) => !on)}
          role="switch"
          aria-checked={motionOn}
          title={motionOn ? '애니메이션 끄기' : '애니메이션 켜기'}
        >
          <span className="motion-switch__track">
            <span className="motion-switch__knob" />
          </span>
          애니메이션
        </button>
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
      </div>
    </div>
  )
}
