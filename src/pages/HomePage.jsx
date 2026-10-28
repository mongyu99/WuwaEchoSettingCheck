import VersionBanner from '../components/VersionBanner'
import PickupCarousel from '../components/PickupCarousel'
import EventSchedule from '../components/EventSchedule'
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
export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-page__main">
        <VersionBanner />

        <section className="home-page__panel">
          <h4 className="home-page__panel-title">이벤트 일정</h4>
          <EventSchedule />
        </section>
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
      </aside>
    </div>
  )
}
