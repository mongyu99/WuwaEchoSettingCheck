import SideNav from './SideNav'
import './SiteLayout.css'

export default function SiteLayout({
  currentPage,
  onGoHome,
  onGoToCharacterList,
  onGoToPatchNotes,
  onGoToEventCalendar,
  children,
}) {
  return (
    <div className="site-layout">
      <SideNav
        currentPage={currentPage}
        onGoHome={onGoHome}
        onGoToCharacterList={onGoToCharacterList}
        onGoToPatchNotes={onGoToPatchNotes}
        onGoToEventCalendar={onGoToEventCalendar}
      />
      <div className="site-layout__main">{children}</div>
    </div>
  )
}
