import { useMemo, useState } from 'react'
import { CHARACTERS, ELEMENTS } from '../config/characters'
import { getValidOptions } from '../config/characterValidOptions'
import { computeSetScores } from '../utils/scoring'
import './CharacterSelectPage.css'

function achievedAvgScore(character, record) {
  const echoes = Array.isArray(record) ? record : record?.echoes
  if (!echoes || echoes.length === 0) return null
  const validLabels = getValidOptions(character.id)
  const percents = computeSetScores(echoes, validLabels, character.name).map((s) => s.percent)
  const avg = percents.reduce((a, b) => a + b, 0) / percents.length
  return Math.round(avg * 10) / 10
}

export default function CharacterSelectPage({ onSelect, characterData }) {
  const [rarity, setRarity] = useState('all') // 'all' | 4 | 5
  const [element, setElement] = useState('all') // 'all' | ELEMENTS[i]
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim()
    return CHARACTERS.filter((c) => {
      if (rarity !== 'all' && c.rarity !== rarity) return false
      if (element !== 'all' && c.element !== element) return false
      if (q && !c.name.includes(q)) return false
      return true
    })
  }, [rarity, element, query])

  return (
    <section className="char-select">
      <header className="char-select__head">
        <span className="uploader__eyebrow">캐릭터 선택</span>
        <h2>에코를 등록할 캐릭터를 고르세요</h2>
      </header>

      <div className="char-select__filters">
        <input
          className="char-select__search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="캐릭터 이름 검색 (예: 능)"
        />

        <div className="char-select__filter-group">
          <button className={`char-select__chip ${rarity === 'all' ? 'char-select__chip--active' : ''}`} onClick={() => setRarity('all')}>전체</button>
          <button className={`char-select__chip ${rarity === 5 ? 'char-select__chip--active' : ''}`} onClick={() => setRarity(5)}>5성</button>
          <button className={`char-select__chip ${rarity === 4 ? 'char-select__chip--active' : ''}`} onClick={() => setRarity(4)}>4성</button>
        </div>

        <div className="char-select__filter-group">
          <button className={`char-select__chip ${element === 'all' ? 'char-select__chip--active' : ''}`} onClick={() => setElement('all')}>전체 속성</button>
          {ELEMENTS.map((el) => (
            <button
              key={el}
              className={`char-select__chip ${element === el ? 'char-select__chip--active' : ''}`}
              onClick={() => setElement(el)}
            >
              {el}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <p className="uploader__hint">조건에 맞는 캐릭터가 없어요.</p>}

      <div className="char-select__grid">
        {filtered.map((c) => {
          const avgScore = achievedAvgScore(c, characterData?.[c.id])
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
                <span className="char-card__rarity">{c.rarity}★</span>
                {avgScore !== null && (
                  <span className="char-card__tier">{avgScore}%</span>
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
