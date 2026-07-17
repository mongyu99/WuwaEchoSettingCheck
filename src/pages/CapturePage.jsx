import ImageUploader from '../components/ImageUploader'
import './CapturePage.css'

export default function CapturePage({ character, onExtractAll, isProcessing, progress, onGoToCharacters }) {
  return (
    <section className="capture-page">
      <div className="capture-page__top">
        <span className="uploader__eyebrow">02 — 캡처</span>
        <button className="capture-page__back" onClick={onGoToCharacters}>
          ← 캐릭터 선택으로
        </button>
      </div>

      <div className="capture-page__body">
        {character && (
          <aside className="capture-page__char-card">
            {character.image ? (
              <img className="capture-page__char-photo" src={character.image} alt={character.name} />
            ) : (
              <div
                className="capture-page__char-photo capture-page__char-photo--fallback"
                style={{ background: character.color }}
              >
                {character.initials}
              </div>
            )}
            <span className="capture-page__char-name">{character.name}</span>
          </aside>
        )}

        <div className="capture-page__uploader">
          <ImageUploader onExtractAll={onExtractAll} isProcessing={isProcessing} progress={progress} />
        </div>
      </div>
    </section>
  )
}
