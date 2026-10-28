import { useEffect, useState } from 'react'
import { fetchPatchNotes } from '../utils/api'
import './PatchNotesPage.css'

const PAGE_SIZE = 10

/** 사이트 업데이트 기록. 관리자 페이지에서 쓴 게시물을 최신순으로 보여주고, 누르면 그 자리에서 본문이 펼쳐집니다. */
export default function PatchNotesPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // 펼친 게시물 id. 첫 페이지를 처음 불러오면 가장 최신 글을 펼쳐 둡니다.
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchPatchNotes({ page, size: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        setData(result)
        setOpenId(page === 0 ? (result.items[0]?.id ?? null) : null)
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
  }, [page])

  return (
    <section className="patch-notes-page">
      <header className="patch-notes-page__head">
        <span className="uploader__eyebrow">패치노트</span>
        <h2>업데이트 소식</h2>
      </header>

      {loading && <p className="uploader__hint">불러오는 중...</p>}

      {!loading && error && <p className="uploader__hint">{error}</p>}

      {!loading && !error && data && data.items.length === 0 && (
        <p className="uploader__hint">등록된 패치노트가 없어요.</p>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <ul className="patch-notes-page__list">
            {data.items.map((note) => {
              const open = openId === note.id
              return (
                <li key={note.id} className={`patch-notes-page__item ${open ? 'patch-notes-page__item--open' : ''}`}>
                  <button
                    className="patch-notes-page__summary"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : note.id)}
                  >
                    <span className="patch-notes-page__version">V{note.version}</span>
                    <span className="patch-notes-page__date">{note.date}</span>
                  </button>
                  {open && <div className="patch-notes-page__content">{note.content}</div>}
                </li>
              )
            })}
          </ul>
          {data.totalPages > 1 && (
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
          )}
        </>
      )}
    </section>
  )
}
