import VersionBanner from '../components/VersionBanner'
import VersionTimer from '../components/VersionTimer'
import PatchNotesList from '../components/PatchNotesList'
import './HomePage.css'

export default function HomePage({ onGoToPatchNotes }) {
  return (
    <>
      <div className="home-page__section">
        <VersionBanner />
      </div>
      <div className="home-page__section">
        <VersionTimer />
      </div>
      <div className="home-page__section">
        <PatchNotesList onGoToPatchNotes={onGoToPatchNotes} />
      </div>
    </>
  )
}
