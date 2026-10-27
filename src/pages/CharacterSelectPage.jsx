import { useMemo, useState } from 'react'
import { CHARACTERS, ELEMENTS, ELEMENT_COLORS } from '../config/characters'
import './CharacterSelectPage.css'

export default function CharacterSelectPage({ onSelect, charactersWithData }) {
  const [element, setElement] = useState('all') // 'all' | ELEMENTS[i]
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim()
    // 최근에 등록한 캐릭터가 먼저 오도록 DB 정렬 순서(sort_order, 새로 등록할수록 커짐)를 뒤집고,
    // 그중 픽업 예정 캐릭터를 맨 앞으로 올립니다.
    return CHARACTERS.filter((c) => {
      if (element !== 'all' && c.element !== element) return false
      if (q && !c.name.includes(q)) return false
      return true
    })
      .reverse()
      .sort((a, b) => Number(b.upcoming) - Number(a.upcoming))
  }, [element, query])

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
          placeholder="캐릭터 이름 검색"
        />

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
        {filtered.map((c) => (
          <button
            key={c.id}
            className={`char-card ${c.upcoming ? 'char-card--upcoming' : ''}`}
            style={{ borderColor: ELEMENT_COLORS[c.element] }}
            // 픽업 예정 캐릭터는 아직 빌드를 등록할 수 없어 선택을 막습니다.
            disabled={c.upcoming}
            onClick={() => onSelect(c)}
          >
            <div className="char-card__photo-wrap">
              {c.image ? (
                <img
                  className={`char-card__photo ${charactersWithData?.has(c.id) ? '' : 'char-card__photo--empty'}`}
                  src={c.image}
                  alt={c.name}
                />
              ) : (
                <div
                  className={`char-card__photo char-card__photo--fallback ${charactersWithData?.has(c.id) ? '' : 'char-card__photo--empty'}`}
                  style={{ background: c.color }}
                >
                  {c.initials}
                </div>
              )}
              {c.rarity && <span className="char-card__rarity">{c.rarity}★</span>}
              {c.upcoming && <span className="char-card__upcoming">픽업 예정</span>}
            </div>
            <span className="char-card__caption">
              {c.name}
              {c.element && (
                <>
                  {' '}
                  <span className="char-card__sep">|</span>{' '}
                  <span style={{ color: ELEMENT_COLORS[c.element] }}>{c.element}</span>
                </>
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
