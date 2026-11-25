import { useMemo, useState } from 'react'
import Modal from './Modal'
import { CHARACTERS, ELEMENTS } from '../config/characters'
import '../pages/CharacterSelectPage.css'
import './CharacterPicker.css'
import { thumbFallback } from '../utils/thumbFallback'

/**
 * 캐릭터 고르기 버튼 + 선택 팝업. 가방 정리·캐릭터 추천·실시간 체크에서 같은 모양으로 씁니다.
 * 버튼에는 고른 캐릭터(얼굴·이름)가 보이고, 누르면 검색·속성 필터가 있는 팝업에서 고릅니다.
 * 목록은 캐릭터 선택 페이지와 같이 최근 등록 순(역순)입니다. 픽업 예정 캐릭터는 넣지 않습니다.
 */
export default function CharacterPicker({ value, onChange, placeholder = '캐릭터 선택', clearLabel = '선택 해제', characterEchoes = null }) {
  // 에코(점수)를 등록한 캐릭터는 컬러, 아닌 캐릭터는 회색으로 보여 줍니다(characterEchoes를 받은 곳에서만).
  const isEmpty = (id) => !!characterEchoes && !(characterEchoes[id]?.length > 0)
  const [open, setOpen] = useState(false)
  const [element, setElement] = useState('all')
  const [query, setQuery] = useState('')
  const [onlySet, setOnlySet] = useState(false) // 에코를 세팅한 캐릭터만

  const list = useMemo(() => {
    const q = query.trim()
    return CHARACTERS.filter((c) => !c.upcoming && (element === 'all' || c.element === element) && (!q || c.name.includes(q)) && (!onlySet || !isEmpty(c.id))).reverse()
  }, [element, query, onlySet, characterEchoes]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (character) => {
    onChange(character)
    setOpen(false)
  }

  return (
    <>
      <button type="button" className={`char-picker__btn ${value ? 'char-picker__btn--on' : ''}`} onClick={() => setOpen(true)}>
        {value?.image ? <img src={value.thumb ?? value.image} onError={thumbFallback(value)} alt="" /> : <span className="char-picker__blank" aria-hidden="true" />}
        <span>{value?.name ?? placeholder}</span>
        <i aria-hidden="true">▾</i>
      </button>

      <Modal wide open={open} title="캐릭터 선택" onClose={() => setOpen(false)}>
        <div className="char-picker">
          <div className="char-select__filters">
            <input
              className="char-select__search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="캐릭터 이름 검색"
              autoFocus
            />
            <div className="char-select__filter-group">
              <button type="button" className={`char-select__chip ${element === 'all' ? 'char-select__chip--active' : ''}`} onClick={() => setElement('all')}>
                전체 속성
              </button>
              {ELEMENTS.map((el) => (
                <button
                  key={el}
                  type="button"
                  className={`char-select__chip ${element === el ? 'char-select__chip--active' : ''}`}
                  onClick={() => setElement(el)}
                >
                  {el}
                </button>
              ))}
              {characterEchoes && (
                <button
                  type="button"
                  className={`char-select__chip ${onlySet ? 'char-select__chip--active' : ''}`}
                  onClick={() => setOnlySet((v) => !v)}
                >
                  세팅 캐릭터
                </button>
              )}
            </div>
          </div>

          {list.length === 0 && <p className="uploader__hint">조건에 맞는 캐릭터가 없어요.</p>}
          <ul className="char-picker__grid">
            {value && (
              <li>
                <button type="button" className="char-picker__item char-picker__item--clear" onClick={() => pick(null)}>
                  <span className="char-picker__blank" aria-hidden="true">×</span>
                  <span>{clearLabel}</span>
                </button>
              </li>
            )}
            {list.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`char-picker__item ${value?.id === c.id ? 'char-picker__item--on' : ''} ${isEmpty(c.id) ? 'char-picker__item--empty' : ''}`}
                  title={isEmpty(c.id) ? `${c.name} · 등록한 에코 없음` : c.name}
                  onClick={() => pick(c)}
                >
                  {c.image ? <img src={c.thumb ?? c.image} onError={thumbFallback(c)} alt="" loading="lazy" decoding="async" /> : <span className="char-picker__blank" />}
                  <span>{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  )
}
