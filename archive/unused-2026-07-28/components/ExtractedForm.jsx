import { STAT_WEIGHTS } from '../utils/scoreCalculator'
import './ExtractedForm.css'

export default function ExtractedForm({ stats, onChange, onCalculate }) {
  const updateStat = (id, field, value) => {
    onChange(stats.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const removeStat = (id) => {
    onChange(stats.filter((s) => s.id !== id))
  }

  const addStat = () => {
    onChange([...stats, { id: `stat-${Date.now()}`, label: '', value: 0 }])
  }

  const statOptions = Object.keys(STAT_WEIGHTS)

  return (
    <section className="form-sheet">
      <header className="form-sheet__head">
        <span className="uploader__eyebrow">02 — 확인 및 수정</span>
        <h2>인식된 스탯이 맞는지 확인하세요</h2>
        <p className="uploader__hint">
          OCR이 읽은 한글 스탯명이 그대로 표시됩니다. 잘못 읽은 값이나 이름은 직접 고치면 되고, 목록에
          있는 스탯명을 입력하면 점수 계산에 반영됩니다.
        </p>
      </header>

      <div className="form-sheet__rows">
        {stats.length === 0 && <p className="form-sheet__empty">아직 추출된 스탯이 없습니다.</p>}

        {stats.map((stat) => (
          <div className="form-row" key={stat.id}>
            <input
              className="form-row__label"
              type="text"
              list="stat-name-options"
              value={stat.label}
              placeholder="스탯명 (예: 치명타 피해)"
              onChange={(e) => updateStat(stat.id, 'label', e.target.value)}
            />
            <input
              className="form-row__value"
              type="number"
              step="0.1"
              value={stat.value}
              onChange={(e) => updateStat(stat.id, 'value', parseFloat(e.target.value) || 0)}
            />
            <button className="form-row__remove" onClick={() => removeStat(stat.id)} aria-label="스탯 삭제">
              ×
            </button>
          </div>
        ))}
        <datalist id="stat-name-options">
          {statOptions.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </div>

      <div className="form-sheet__actions">
        <button className="btn btn--ghost" onClick={addStat}>
          + 스탯 직접 추가
        </button>
        <button className="btn btn--primary" onClick={onCalculate} disabled={stats.length === 0}>
          점수 계산
        </button>
      </div>
    </section>
  )
}
