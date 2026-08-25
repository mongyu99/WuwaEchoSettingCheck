import { PATCH_NOTES } from '../config/patchNotes'
import './PatchNotesList.css'

const COLLAPSED_COUNT = 3

export default function PatchNotesList({ onGoToPatchNotes }) {
  const visible = PATCH_NOTES.slice(0, COLLAPSED_COUNT)

  return (
    <div className="patch-notes">
      <div className="patch-notes__head">
        <h4 className="patch-notes__title">최신 패치노트</h4>
        {PATCH_NOTES.length > 0 && (
          <button className="patch-notes__more" onClick={onGoToPatchNotes}>
            + 더보기
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
