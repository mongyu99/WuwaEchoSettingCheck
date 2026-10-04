import { useCallback, useEffect, useState } from 'react'

const API = 'http://localhost:8081/api/admin'
const STATUSES = ['ACTIVE', 'HIDDEN', 'UPCOMING']

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || body.detail || `요청 실패 (${res.status})`)
  }
  return res.status === 204 ? null : res.json()
}

const MAX_IMAGE_SIDE = 1024
const WEBP_QUALITY = 0.85

/** 이미지 파일을 긴 변 MAX_IMAGE_SIDE 이하로 줄이고 webp로 변환합니다(브라우저 canvas 사용). */
async function toWebp(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY))
  if (!blob || blob.type !== 'image/webp') throw new Error('이 브라우저는 webp 변환을 지원하지 않아요.')
  return { blob, width: canvas.width, height: canvas.height }
}

const kb = (bytes) => `${Math.round(bytes / 1024).toLocaleString()}KB`

function emptyRow(columns, rows) {
  const row = Object.fromEntries(columns.map((c) => [c.name, '']))
  row.status = 'ACTIVE'
  row.sort_order = String(rows.reduce((max, r) => Math.max(max, Number(r.sort_order) || 0), 0) + 1)
  return row
}

export default function AdminApp() {
  const [tables, setTables] = useState(null)
  const [kind, setKind] = useState('characters')
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewVersion, setPreviewVersion] = useState(0)

  useEffect(() => {
    request('/tables')
      .then(setTables)
      .catch(() => setMessage('관리자 API에 연결할 수 없어요. 백엔드를 admin 프로필로 로컬에서 실행했는지 확인하세요.'))
  }, [])

  const load = useCallback(() => {
    request(`/${kind}`).then(setRows).catch((e) => setMessage(e.message))
  }, [kind])

  useEffect(() => {
    if (tables) load()
  }, [tables, load])

  if (!tables) {
    return (
      <>
        <LocalBanner />
        <main className="admin">{message && <p className="admin__message admin__message--error">{message}</p>}</main>
      </>
    )
  }

  const table = tables[kind]
  const q = query.trim().toLowerCase()
  const visible = q ? rows.filter((r) => `${r.id} ${r.name}`.toLowerCase().includes(q)) : rows

  const startNew = () => {
    setForm(emptyRow(table.columns, rows))
    setIsNew(true)
    setMessage('')
  }

  const startEdit = (row) => {
    setForm(Object.fromEntries(table.columns.map((c) => [c.name, row[c.name] ?? ''])))
    setIsNew(false)
    setMessage('')
  }

  const save = async () => {
    if (!form.id?.trim()) {
      setMessage('ID를 입력하세요.')
      return
    }
    try {
      await request(`/${kind}/${encodeURIComponent(form.id.trim())}`, { method: 'PUT', body: JSON.stringify(form) })
      setMessage(`저장했어요: ${form.name || form.id}`)
      setForm(null)
      load()
    } catch (e) {
      setMessage(e.message)
    }
  }

  const uploadImage = async (file) => {
    if (!file) return
    const id = form.id?.trim()
    if (!id) {
      setMessage('이미지를 올리기 전에 ID를 먼저 입력하세요.')
      return
    }
    setUploading(true)
    try {
      const { blob, width, height } = await toWebp(file)
      const res = await fetch(`${API}/${kind}/${encodeURIComponent(id)}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/webp' },
        body: blob,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || body.detail || `업로드 실패 (${res.status})`)
      }
      const { path } = await res.json()
      setForm((f) => ({ ...f, [table.imageColumn]: path }))
      setPreviewVersion(Date.now())
      setMessage(`webp로 변환해 저장했어요: ${file.name} ${kb(file.size)} → ${kb(blob.size)} (${width}×${height})`)
      if (!isNew) load()
    } catch (e) {
      setMessage(e.message)
    } finally {
      setUploading(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`정말 삭제할까요? (${form.name || form.id})`)) return
    try {
      await request(`/${kind}/${encodeURIComponent(form.id)}`, { method: 'DELETE' })
      setMessage(`삭제했어요: ${form.name || form.id}`)
      setForm(null)
      load()
    } catch (e) {
      setMessage(e.message)
    }
  }

  return (
    <>
      <LocalBanner />
      <main className="admin">
        <nav className="admin__tabs">
          {Object.entries(tables).map(([key, t]) => (
            <button
              key={key}
              className={`admin__tab ${key === kind ? 'admin__tab--active' : ''}`}
              onClick={() => {
                setKind(key)
                setForm(null)
                setQuery('')
                setMessage('')
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {message && <p className="admin__message">{message}</p>}

        <div className="admin__layout">
          <section className="admin__list">
            <div className="admin__list-head">
              <input
                className="admin__input"
                placeholder="ID 또는 이름 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="admin__btn admin__btn--primary" onClick={startNew}>
                + 새 {table.label}
              </button>
            </div>
            <p className="admin__count">{visible.length}개</p>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>순서</th>
                  <th>ID</th>
                  <th>이름</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={row.id}
                    className={form && !isNew && form.id === row.id ? 'admin__row--selected' : ''}
                    onClick={() => startEdit(row)}
                  >
                    <td>{row.sort_order}</td>
                    <td className="admin__mono">{row.id}</td>
                    <td>{row.name}</td>
                    <td className={`admin__status admin__status--${row.status}`}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {form && (
            <section className="admin__form">
              <h2>{isNew ? `새 ${table.label} 등록` : `${table.label} 수정`}</h2>
              <div className="admin__image">
                {form[table.imageColumn] ? (
                  <img src={`/${form[table.imageColumn]}?v=${previewVersion}`} alt="" />
                ) : (
                  <div className="admin__image-empty">이미지 없음</div>
                )}
                <label className={`admin__btn ${uploading ? 'admin__btn--disabled' : ''}`}>
                  {uploading ? '변환 중...' : '이미지 업로드 (자동 webp 변환)'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploading}
                    onChange={(e) => {
                      uploadImage(e.target.files[0])
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              {table.columns.map((col) => (
                <label key={col.name} className="admin__field">
                  <span>
                    {col.label}
                    {col.required && <em> *</em>}
                  </span>
                  {col.type === 'STATUS' ? (
                    <select
                      className="admin__input"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  ) : col.name === 'description' || col.name === 'passive_description' ? (
                    <textarea
                      className="admin__input"
                      rows={4}
                      value={form[col.name] ?? ''}
                      onChange={(e) => setForm({ ...form, [col.name]: e.target.value })}
                    />
                  ) : (
                    <input
                      className="admin__input"
                      inputMode={col.type === 'TEXT' ? 'text' : 'decimal'}
                      value={form[col.name] ?? ''}
                      disabled={col.name === 'id' && !isNew}
                      onChange={(e) => setForm({ ...form, [col.name]: e.target.value })}
                    />
                  )}
                </label>
              ))}
              <div className="admin__actions">
                <button className="admin__btn admin__btn--primary" onClick={save}>
                  저장
                </button>
                <button className="admin__btn" onClick={() => setForm(null)}>
                  취소
                </button>
                {!isNew && (
                  <button className="admin__btn admin__btn--danger" onClick={remove}>
                    삭제
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}

function LocalBanner() {
  return (
    <div className="admin-banner" role="alert">
      LOCAL · 로컬 관리자 페이지입니다 · 운영 서버가 아닌 로컬 DB를 수정합니다
    </div>
  )
}
