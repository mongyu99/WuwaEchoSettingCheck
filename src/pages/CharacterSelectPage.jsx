import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { assetPath } from '../config/assetPath'
import { getValidOptions } from '../config/characterValidOptions'
import { gradeOf, scoreEchoes } from '../utils/echoScore'
import { CHARACTERS, ELEMENTS, ELEMENT_COLORS } from '../config/characters'
import './CharacterSelectPage.css'

/** 에코를 등록한 캐릭터 카드에 합계 등급과 점수를 띄웁니다. */
function CardGrade({ echoes, characterId }) {
  const total = scoreEchoes(echoes, getValidOptions(characterId))
  const grade = gradeOf(total)
  return (
    <span className="char-card__grade">
      <img src={assetPath(`grades/${grade.icon}.png`)} alt={grade.label} />
      {total.toFixed(1)}
    </span>
  )
}

export default function CharacterSelectPage({ onSelect, charactersWithData, characterEchoes }) {
  const [element, setElement] = useState('all') // 'all' | ELEMENTS[i]
  const [query, setQuery] = useState('')
  // 필터로 목록이 줄어도 페이지 높이는 줄이지 않습니다(아래 푸터가 위아래로 튀지 않게). 늘어날 때만 따라갑니다.
  const sectionRef = useRef(null)
  const maxHeightRef = useRef(0)
  const [onlySet, setOnlySet] = useState(false) // 에코를 세팅한 캐릭터만
  const [sort, setSort] = useState('recent') // 'recent'(최신 캐릭터순) → 'high'(점수 높은 순) → 'low'(낮은 순)
  const scoreOf = (id) => (characterEchoes?.[id]?.length > 0 ? scoreEchoes(characterEchoes[id], getValidOptions(id)) : null)

  const filtered = useMemo(() => {
    const q = query.trim()
    // 최근에 등록한 캐릭터가 먼저 오도록 DB 정렬 순서(sort_order, 새로 등록할수록 커짐)를 뒤집고,
    // 그중 픽업 예정 캐릭터를 맨 앞으로 올립니다.
    return CHARACTERS.filter((c) => {
      if (element !== 'all' && c.element !== element) return false
      if (q && !c.name.includes(q)) return false
      if (onlySet && !charactersWithData?.has(c.id)) return false
      return true
    })
      .reverse()
      .sort((a, b) => {
        if (sort === 'recent') return Number(b.upcoming) - Number(a.upcoming)
        // 점수순: 세팅 안 한 캐릭터는 항상 맨 뒤
        const sa = scoreOf(a.id)
        const sb = scoreOf(b.id)
        if (sa === null || sb === null) return (sa === null) - (sb === null)
        return sort === 'high' ? sb - sa : sa - sb
      })
  }, [element, query, onlySet, sort, characterEchoes]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const el = sectionRef.current
    if (!el) return
    el.style.minHeight = ''
    maxHeightRef.current = Math.max(maxHeightRef.current, el.offsetHeight)
    el.style.minHeight = `${maxHeightRef.current}px`
  })

  return (
    <section className="char-select" ref={sectionRef}>
      <header className="char-select__head">
        <span className="uploader__eyebrow">캐릭터 선택</span>
        <h2>등록할 캐릭터를 고르세요</h2>
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
          <button className={`char-select__chip ${onlySet ? 'char-select__chip--active' : ''}`} onClick={() => setOnlySet((v) => !v)}>
            세팅 캐릭터
          </button>
          {/* 오른쪽 끝: 누를 때마다 최신순 → 점수 높은 순 → 점수 낮은 순 */}
          <button
            className={`char-select__chip char-select__sort ${sort !== 'recent' ? 'char-select__chip--active' : ''}`}
            onClick={() => setSort((v) => (v === 'recent' ? 'high' : v === 'high' ? 'low' : 'recent'))}
          >
            {sort === 'recent' ? '최신순' : sort === 'high' ? '점수 높은 순 ↓' : '점수 낮은 순 ↑'}
          </button>
        </div>
      </div>

      {filtered.length === 0 && <p className="uploader__hint">조건에 맞는 캐릭터가 없어요.</p>}

      {/* 속성·세팅 캐릭터·정렬을 바꾸면 목록을 통째로 새로 그려 물결 등장을 처음부터 다시 재생합니다.
          (key가 그대로면 남아 있던 카드는 그대로 두고 새로 생긴 카드만 자기 순번만큼 기다렸다 나타나서, 중간중간 빈칸이 보였습니다.) */}
      <div key={`${element}|${onlySet}|${sort}`} className="char-select__grid">
        {filtered.map((c, i) => (
          <button
            key={c.id}
            className={`char-card ${c.upcoming ? 'char-card--upcoming' : ''}`}
            // --i: 순서대로 물결치듯 등장시키기 위한 번호
            style={{ borderColor: ELEMENT_COLORS[c.element], '--i': i }}
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
              {characterEchoes?.[c.id]?.length > 0 && <CardGrade echoes={characterEchoes[c.id]} characterId={c.id} />}
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
