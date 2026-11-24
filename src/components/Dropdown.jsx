import { useEffect, useRef, useState } from 'react'
import './Dropdown.css'

/**
 * 기본 <select> 대신 쓰는 드롭다운(사이트 디자인에 맞춘 모양).
 * 누르면 바로 아래에 목록이 열리고, 바깥을 누르거나 Esc를 누르면 닫힙니다.
 * options: [{ value, label, icon?, group? }] — group이 바뀌는 곳마다 작은 제목 줄이 들어갑니다.
 * placeholder: 아무것도 안 골랐을 때 버튼에 보이는 글자(비워 두면 빈칸처럼 보입니다).
 * fallbackLabel: 값이 목록에 없을 때(예: 강화 중이라 메인 수치가 목록과 다름) 대신 보여 줄 글자.
 */
export default function Dropdown({ value, options, onChange, placeholder = '', fallbackLabel = '', ariaLabel, disabled = false, className = '' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const current = options.find((o) => o.value === value) ?? null

  useEffect(() => {
    if (!open) return undefined
    const doc = rootRef.current?.ownerDocument ?? document
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    doc.addEventListener('mousedown', onDown)
    doc.addEventListener('keydown', onKey)
    // 고른 항목이 보이게 목록을 스크롤합니다.
    listRef.current?.querySelector('.dropdown__item--on')?.scrollIntoView({ block: 'nearest' })
    return () => {
      doc.removeEventListener('mousedown', onDown)
      doc.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (v) => {
    onChange(v)
    setOpen(false)
  }

  let lastGroup = null
  return (
    <div className={`dropdown ${open ? 'dropdown--open' : ''} ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`dropdown__btn ${current || fallbackLabel ? '' : 'dropdown__btn--empty'}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {current?.icon && <img src={current.icon} alt="" />}
        <span>{current ? current.label : fallbackLabel || placeholder}</span>
        <i aria-hidden="true">▾</i>
      </button>
      {open && (
        <ul className="dropdown__list" role="listbox" ref={listRef}>
          {options.map((o) => {
            const head = o.group && o.group !== lastGroup ? o.group : null
            lastGroup = o.group ?? lastGroup
            return (
              <li key={`${o.group ?? ''}|${o.value}`} role="presentation">
                {head && <p className="dropdown__group">{head}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  className={`dropdown__item ${o.value === value ? 'dropdown__item--on' : ''}`}
                  onClick={() => pick(o.value)}
                >
                  {o.icon && <img src={o.icon} alt="" />}
                  <span>{o.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
