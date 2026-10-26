import VersionBanner from '../components/VersionBanner'
import VersionTimer from '../components/VersionTimer'
import PickupCarousel from '../components/PickupCarousel'
import EventSchedule from '../components/EventSchedule'
import XTimeline from '../components/XTimeline'
import { OFFICIAL_X_HANDLE, NAVER_LOUNGE_URL } from '../config/officialNews'
import './HomePage.css'

// 왼쪽: 메인 배너 → 픽업 일정 → 이벤트 일정, 오른쪽: 공식 소식.
export default function HomePage({ theme }) {
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
            <a
              className="home-page__naver"
              href={NAVER_LOUNGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="네이버 게임 라운지에서 보기"
              title="네이버 게임 라운지"
            >
              <span className="home-page__naver-mark" aria-hidden="true">
                N
              </span>
            </a>
          </div>
          <XTimeline handle={OFFICIAL_X_HANDLE} theme={theme} />
        </section>
      </aside>
    </div>
  )
}
