import { useState } from 'react'
import { PATCH_NOTES } from '../config/patchNotes'
import './PatchNotesList.css'

const COLLAPSED_COUNT = 3

export default function PatchNotesList() {
  const [expanded, setExpanded] = useState(false)
  const hasMore = PATCH_NOTES.length > COLLAPSED_COUNT
  const visible = expanded ? PATCH_NOTES : PATCH_NOTES.slice(0, COLLAPSED_COUNT)

  return (
    <div className="patch-notes">
      <div className="patch-notes__head">
        <h4 className="patch-notes__title">최신 패치노트</h4>
        {hasMore && (
          <button className="patch-notes__more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? '접기' : '+ 더보기'}
          </button>
        )}
      </div>
      {PATCH_NOTES.length === 0 ? (
        <p className="uploader__hint"></p>
      ) : (
        <ul className="patch-notes__list">
          {visible.map((note) => (
            <li key={note.url} className="patch-notes__item">
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
