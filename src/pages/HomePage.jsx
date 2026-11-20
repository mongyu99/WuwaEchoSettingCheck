import { useState } from 'react'
import VersionBanner from '../components/VersionBanner'
import VersionTimer from '../components/VersionTimer'
import PickupCarousel from '../components/PickupCarousel'
import EventSchedule from '../components/EventSchedule'
import BroadcastNews from '../components/BroadcastNews'
import CommunityEvents from '../components/CommunityEvents'
import { OFFICIAL_X_HANDLE, NAVER_LOUNGE_URL, OFFICIAL_SITE_URL, YOUTUBE_URL } from '../config/officialNews'
import { assetPath } from '../config/assetPath'
import './HomePage.css'

const OFFICIAL_LINKS = [
  // 공식 홈페이지 파비콘(36×36)을 public/icons/에 받아 둔 이미지를 씁니다.
  { key: 'site', icon: assetPath('icons/wuwa-official.png'), href: OFFICIAL_SITE_URL, label: '공식 홈페이지' },
  { key: 'youtube', mark: '', href: YOUTUBE_URL, label: 'YouTube' },
  { key: 'x', mark: 'X', href: `https://x.com/${OFFICIAL_X_HANDLE}`, label: `X @${OFFICIAL_X_HANDLE}` },
  { key: 'naver', mark: 'N', href: NAVER_LOUNGE_URL, label: '네이버 라운지' },
]

// 인게임 단말기 화면처럼: 왼쪽은 메인 배너·타이머·이벤트, 오른쪽은 공식 소식 아이콘 타일과 픽업 일정.
// 처음 온 사람이 바로 누를 수 있게 상단에 두는 주요 기능 바로가기입니다.
const SHORTCUTS = [
  { key: 'bag', title: '에코 가방 스캔', desc: '가방을 넘기면서 에코를 한꺼번에 인식', handler: 'onGoToEchoBag' },
  { key: 'score', title: '에코 점수 체크', desc: '캐릭터 고르고 에코 스샷으로 점수 확인', handler: 'onGoToCharacters' },
  { key: 'live', title: '실시간 체크', desc: '게임 화면 공유로 에코 볼 때마다 바로 체크', handler: 'onGoToLiveCheck' },
]

export default function HomePage(props) {
  const [currentBanner, setCurrentBanner] = useState(null)

  return (
    <div className="home-page">
      <nav className="home-page__shortcuts" aria-label="주요 기능 바로가기">
        {SHORTCUTS.map((s) => (
          <button key={s.key} type="button" className="home-page__shortcut" onClick={props[s.handler]}>
            <span className="home-page__shortcut-title">{s.title}</span>
            <span className="home-page__shortcut-desc">{s.desc}</span>
          </button>
        ))}
      </nav>

      <div className="home-page__main">
        <VersionBanner onCurrentChange={setCurrentBanner} />

        <section className="home-page__panel">
          <h4 className="home-page__panel-title">이벤트 일정</h4>
          <EventSchedule />
        </section>

        <CommunityEvents />
      </div>

      <aside className="home-page__side">
        <section className="home-page__panel">
          <h4 className="home-page__panel-title">공식 소식</h4>
          <ul className="home-page__links">
            {OFFICIAL_LINKS.map((link) => (
              <li key={link.key}>
                <a
                  className="home-page__link"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.label}에서 보기`}
                >
                  {link.icon ? (
                    <img className="home-page__link-icon" src={link.icon} alt="" aria-hidden="true" />
                  ) : (
                    <span className={`home-page__link-mark home-page__link-mark--${link.key}`} aria-hidden="true">
                      {link.mark}
                    </span>
                  )}
                  <span className="home-page__link-label">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-page__panel">
          <h4 className="home-page__panel-title">픽업 일정</h4>
          <PickupCarousel />
        </section>

        <BroadcastNews />

        {currentBanner && <VersionTimer startsAt={currentBanner.startsAt} endsAt={currentBanner.endsAt} />}
      </aside>
    </div>
  )
}
