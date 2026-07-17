import { useState } from 'react'
import EchoPanel from '../components/EchoPanel'
import ConfirmDialog from '../components/ConfirmDialog'
import './EditPage.css'

function hasIncompleteStat(echoes) {
  return echoes.some((echo) => echo.subStats.some((s) => !s.label || !s.valueText))
}

export default function EditPage({ echoes, onUpdateSubStats, onReplaceOne, replacingId, onProceedToStats, onGoToCharacters }) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleProceedClick = () => {
    if (hasIncompleteStat(echoes)) {
      setConfirmOpen(true)
      return
    }
    onProceedToStats()
  }

  return (
    <section className="edit-page">
      <header className="edit-page__head">
        <div className="edit-page__head-top">
          <span className="uploader__eyebrow">수정</span>
          <button className="capture-page__back" onClick={onGoToCharacters}>
            ← 캐릭터 선택으로
          </button>
        </div>
        <h2>인식된 스탯을 확인·수정하세요</h2>
      </header>

      <div className="echo-list">
        {echoes.map((echo, idx) => (
          <div className="echo-row" key={echo.id}>
            <label
              className={`echo-row__thumb-wrap ${replacingId === echo.id ? 'echo-row__thumb-wrap--busy' : ''}`}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) onReplaceOne(echo.id, file)
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <img className="echo-row__thumb" src={echo.previewUrl} alt={`에코 ${idx + 1} 스캔 영역`} />
              <span className="echo-row__replace">
                {replacingId === echo.id ? '교체 중…' : '사진 교체 (클릭 또는 드래그)'}
              </span>
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={replacingId !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onReplaceOne(echo.id, file)
                  e.target.value = ''
                }}
              />
            </label>
            <EchoPanel echo={echo} index={idx} onUpdateSubStats={onUpdateSubStats} />
          </div>
        ))}
      </div>

      {echoes.length > 0 && (
        <div className="edit-page__actions">
          <button className="btn btn--primary" onClick={handleProceedClick}>
            점수 통계 보기 →
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="선택하지 않은 항목이 있어요"
        message="스탯명이나 수치를 고르지 않은 서브 스탯이 있어요. 선택하지 않은 게 맞나요?"
        confirmLabel="예, 맞아요"
        cancelLabel="아니요, 다시 볼게요"
        onConfirm={() => {
          setConfirmOpen(false)
          onProceedToStats()
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  )
}
