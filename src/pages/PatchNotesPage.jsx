import { useEffect, useState } from 'react'
import { fetchPatchNotes } from '../utils/api'
import './PatchNotesPage.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

export default function PatchNotesPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchPatchNotes({ query: debouncedQuery, page, size: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '패치노트를 불러오는 데 실패했어요.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, page])

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

      {loading && <p className="uploader__hint">불러오는 중...</p>}

      {!loading && error && <p className="uploader__hint">{error}</p>}

      {!loading && !error && data && data.items.length === 0 && (
        <p className="uploader__hint">
          {data.totalElements === 0 ? '등록된 패치노트가 없어요.' : '검색 결과가 없어요.'}
        </p>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <ul className="patch-notes-page__list">
            {data.items.map((note) => (
              <li key={note.id} className="patch-notes-page__item">
                <a href={note.url} target="_blank" rel="noreferrer">
                  {note.title}
                </a>
                <span className="patch-notes-page__date">{note.date}</span>
              </li>
            ))}
          </ul>
          <div className="patch-notes-page__pager">
            <button
              className="patch-notes-page__pager-btn"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              이전
            </button>
            <span className="patch-notes-page__pager-status">
              {data.page + 1} / {data.totalPages}
            </span>
            <button
              className="patch-notes-page__pager-btn"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasNext}
            >
              다음
            </button>
          </div>
        </>
      )}
    </section>
  )
}
