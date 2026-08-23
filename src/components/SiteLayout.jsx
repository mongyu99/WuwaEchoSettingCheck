import SideNav from './SideNav'
import './SiteLayout.css'

export default function SiteLayout({ currentPage, onGoHome, onGoToCharacterList, children }) {
  return (
    <div className="site-layout">
      <SideNav currentPage={currentPage} onGoHome={onGoHome} onGoToCharacterList={onGoToCharacterList} />
      <div className="site-layout__main">{children}</div>
    </div>
  )
}
