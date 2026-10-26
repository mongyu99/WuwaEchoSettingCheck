import VersionBanner from '../components/VersionBanner'
import VersionTimer from '../components/VersionTimer'
import PatchNotesList from '../components/PatchNotesList'
import PickupCarousel from '../components/PickupCarousel'
import EventSchedule from '../components/EventSchedule'
import XTimeline from '../components/XTimeline'
import { OFFICIAL_X_HANDLE } from '../config/officialNews'
import './HomePage.css'

// 왼쪽: 메인 배너 → 픽업 일정 → 이벤트 일정 순서의 본문, 오른쪽: 공식 소식(스크롤해도 따라옴).
export default function HomePage({ theme, onGoToCharacterList, onGoToPatchNotes, onGoToEventCalendar }) {
  const quickLinks = [
    { title: '캐릭터 빌드 체크', desc: '에코 스크린샷으로 빌드 점수 확인', onClick: onGoToCharacterList },
    { title: '패치노트', desc: '버전별 변경 사항 모아 보기', onClick: onGoToPatchNotes },
    { title: '이벤트 캘린더', desc: '진행 중·예정 이벤트 일정', onClick: onGoToEventCalendar },
  ]

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
          <div className="home-page__panel-head">
            <h4 className="home-page__panel-title">이벤트 일정</h4>
            <button className="home-page__panel-more" onClick={onGoToEventCalendar}>
              전체 보기
            </button>
          </div>
          <EventSchedule onGoToEventCalendar={onGoToEventCalendar} />
        </section>

        <nav className="home-page__quick" aria-label="바로가기">
          {quickLinks.map((link) => (
            <button key={link.title} className="home-page__card" onClick={link.onClick}>
              <span className="home-page__card-title">{link.title}</span>
              <span className="home-page__card-desc">{link.desc}</span>
              <span className="home-page__card-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </nav>

        <PatchNotesList onGoToPatchNotes={onGoToPatchNotes} />
      </div>

      <aside className="home-page__side">
        <section className="home-page__panel">
          <h4 className="home-page__panel-title">공식 소식</h4>
          <XTimeline handle={OFFICIAL_X_HANDLE} theme={theme} />
        </section>
      </aside>
    </div>
  )
}
