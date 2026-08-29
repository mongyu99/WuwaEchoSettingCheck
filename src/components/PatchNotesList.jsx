import { useEffect, useState } from 'react'
import { fetchPatchNotes } from '../utils/api'
import './PatchNotesList.css'

const COLLAPSED_COUNT = 3

export default function PatchNotesList({ onGoToPatchNotes }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchPatchNotes({ size: COLLAPSED_COUNT })
      .then((result) => {
        if (!cancelled) setNotes(result.items)
      })
      .catch(() => {
        if (!cancelled) setNotes([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="patch-notes">
      <div className="patch-notes__head">
        <h4 className="patch-notes__title">최신 패치노트</h4>
        {notes.length > 0 && (
          <button className="patch-notes__more" onClick={onGoToPatchNotes}>
            + 더보기
          </button>
        )}
      </div>
      {!loading && notes.length === 0 ? (
        <p className="uploader__hint">등록된 패치노트가 없어요.</p>
      ) : (
        <ul className="patch-notes__list">
          {notes.map((note) => (
            <li key={note.id} className="patch-notes__item">
              <a href={note.url} target="_blank" rel="noreferrer">
                {note.title}
              </a>
              <span className="patch-notes__date">{note.date}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
