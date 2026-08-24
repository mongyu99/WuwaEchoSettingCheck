import { useMemo, useState } from 'react'
import { PATCH_NOTES } from '../config/patchNotes'
import './PatchNotesPage.css'

export default function PatchNotesPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return PATCH_NOTES
    return PATCH_NOTES.filter((note) => note.title.includes(q))
  }, [query])

  return (
    <section className="patch-notes-page">
      <header className="patch-notes-page__head">
        <span className="uploader__eyebrow">패치노트</span>
        <h2>업데이트 소식</h2>
      </header>

      <input
        className="patch-notes-page__search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="패치노트 제목 검색"
      />

      {filtered.length === 0 ? (
        <p className="uploader__hint">
          {PATCH_NOTES.length === 0 ? '등록된 패치노트가 없어요.' : '검색 결과가 없어요.'}
        </p>
      ) : (
        <ul className="patch-notes-page__list">
          {filtered.map((note) => (
            <li key={note.url} className="patch-notes-page__item">
              <a href={note.url} target="_blank" rel="noreferrer">
                {note.title}
              </a>
              <span className="patch-notes-page__date">{note.date}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
