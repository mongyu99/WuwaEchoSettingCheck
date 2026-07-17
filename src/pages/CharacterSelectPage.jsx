import { CHARACTERS } from '../config/characters'
import { getValidOptions } from '../config/characterValidOptions'
import { computeEchoScore, scoreToTier, tierColor } from '../utils/scoring'
import './CharacterSelectPage.css'

function achievedTier(characterId, echoes) {
  if (!echoes || echoes.length === 0) return null
  const validLabels = getValidOptions(characterId)
  const scores = echoes.map((e) => computeEchoScore(e.subStats, validLabels).score)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return scoreToTier(avg)
}

export default function CharacterSelectPage({ onSelect, characterData }) {
  return (
    <section className="char-select">
      <header className="char-select__head">
        <span className="uploader__eyebrow">캐릭터 선택</span>
        <h2>에코를 등록할 캐릭터를 고르세요</h2>
      </header>

      <div className="char-select__grid">
        {CHARACTERS.map((c) => {
          const tier = achievedTier(c.id, characterData?.[c.id])
          return (
            <button key={c.id} className="char-card" onClick={() => onSelect(c)}>
              <div className="char-card__photo-wrap">
                {c.image ? (
                  <img className="char-card__photo" src={c.image} alt={c.name} />
                ) : (
                  <div className="char-card__photo char-card__photo--fallback" style={{ background: c.color }}>
                    {c.initials}
                  </div>
                )}
                {tier && (
                  <span
                    className="char-card__tier"
                    style={{ color: tierColor(tier), borderColor: tierColor(tier) }}
                  >
                    {tier}
                  </span>
                )}
              </div>
              <span className="char-card__caption">
                {c.name} <span className="char-card__sep">|</span> {c.element}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
