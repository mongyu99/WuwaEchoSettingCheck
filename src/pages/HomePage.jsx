import VersionBanner from '../components/VersionBanner'
import VersionTimer from '../components/VersionTimer'
import PickupCarousel from '../components/PickupCarousel'
import EventSchedule from '../components/EventSchedule'
import { OFFICIAL_X_HANDLE, NAVER_LOUNGE_URL, OFFICIAL_SITE_URL, YOUTUBE_URL } from '../config/officialNews'
import { assetPath } from '../config/assetPath'
import './HomePage.css'

const OFFICIAL_LINKS = [
  // 공식 홈페이지 파비콘(36×36)을 public/icons/에 받아 둔 이미지를 씁니다.
  { key: 'site', icon: assetPath('icons/wuwa-official.png'), href: OFFICIAL_SITE_URL, label: '명조 공식 홈페이지' },
  { key: 'youtube', mark: '', href: YOUTUBE_URL, label: '명조 공식 YouTube' },
  { key: 'x', mark: 'X', href: `https://x.com/${OFFICIAL_X_HANDLE}`, label: `X 공식 계정 @${OFFICIAL_X_HANDLE}` },
  { key: 'naver', mark: 'N', href: NAVER_LOUNGE_URL, label: '네이버 게임 라운지' },
]

// 왼쪽: 메인 배너 → 픽업 일정 → 이벤트 일정, 오른쪽: 공식 소식 바로가기.
export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-page__main">
        <VersionBanner />
        <VersionTimer />

        <section className="home-page__panel">
          <h4 className="home-page__panel-title">픽업 일정</h4>
          <PickupCarousel />
        </section>

        <section className="home-page__panel">
          <h4 className="home-page__panel-title">이벤트 일정</h4>
          <EventSchedule />
        </section>
      </div>

      <aside className="home-page__side">
        <section className="home-page__panel">
          <div className="home-page__panel-head">
            <h4 className="home-page__panel-title">공식 소식</h4>
            <div className="home-page__links">
              {OFFICIAL_LINKS.map((link) => (
                <a
                  key={link.key}
                  className="home-page__link"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.label}에서 보기`}
                  title={link.label}
                >
                  {link.icon ? (
                    <img className="home-page__link-icon" src={link.icon} alt="" aria-hidden="true" />
                  ) : (
                    <span className={`home-page__link-mark home-page__link-mark--${link.key}`} aria-hidden="true">
                      {link.mark}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      </aside>
    </div>
  )
}
