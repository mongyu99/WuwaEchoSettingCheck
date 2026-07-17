import { useState } from 'react'
import './SidebarNav.css'

const NAV_ITEMS = [
  { key: 'home', label: '메인' },
  { key: 'characters', label: '에코 세팅 (캐릭터 선택)' },
]

export default function SidebarNav({ page, onNavigate }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={open}
      >
        {open ? '×' : '☰'}
      </button>

      {open && (
        <>
          <div className="sidebar-backdrop" onClick={() => setOpen(false)} />
          <nav className="sidebar-panel">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                className={`sidebar-panel__item ${page === item.key ? 'sidebar-panel__item--active' : ''}`}
                onClick={() => {
                  onNavigate(item.key)
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </>
      )}
    </>
  )
}
