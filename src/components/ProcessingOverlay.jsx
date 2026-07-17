import './ProcessingOverlay.css'

export default function ProcessingOverlay({ character, progress }) {
  return (
    <div className="processing-overlay">
      <div className="processing-overlay__card">
        <div className="processing-overlay__ring">
          <div className="processing-overlay__avatar">
            {character?.image ? (
              <img src={character.image} alt={character.name} />
            ) : (
              <span>{character?.initials ?? '?'}</span>
            )}
          </div>
        </div>
        <p className="processing-overlay__label">
          메아리 인식 중… {Math.round((progress ?? 0) * 100)}%
        </p>
      </div>
    </div>
  )
}
