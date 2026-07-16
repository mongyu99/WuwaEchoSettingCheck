import { STAT_WEIGHTS } from '../utils/scoreCalculator'
import './EchoPanel.css'

const statOptions = Object.keys(STAT_WEIGHTS)

export default function EchoPanel({ echo, index, onUpdateSubStats }) {
  const updateSub = (id, field, value) => {
    onUpdateSubStats(echo.id, echo.subStats.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }
  const removeSub = (id) => {
    onUpdateSubStats(echo.id, echo.subStats.filter((s) => s.id !== id))
  }
  const addSub = () => {
    if (echo.subStats.length >= 5) return
    onUpdateSubStats(echo.id, [...echo.subStats, { id: `stat-${Date.now()}`, label: '', valueText: '' }])
  }

  return (
    <article className="echo-panel">
      <header className="echo-panel__header">
        <span className="echo-panel__badge">사진 {index + 1}</span>
      </header>

      {echo.failed && <p className="echo-panel__failed">이 사진은 인식에 실패했어요. 값을 직접 입력해주세요.</p>}

      <section className="echo-panel__block echo-panel__block--main">
        <h3>메인 스탯</h3>
        <ul>
          {echo.mainStats.length === 0 && <li className="echo-panel__empty">인식된 메인 스탯 없음</li>}
          {echo.mainStats.map((s) => (
            <li key={s.id}>
              <span>{s.label}</span>
              <span>{s.valueText}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="echo-panel__block echo-panel__block--sub">
        <h3>서브 스탯 <span className="echo-panel__count">{echo.subStats.length}/5</span></h3>
        <ul>
          {echo.subStats.length === 0 && <li className="echo-panel__empty">서브 스탯 없음</li>}
          {echo.subStats.map((s) => (
            <li key={s.id} className={`echo-panel__sub-row ${s.highlighted ? 'echo-panel__sub-row--highlight' : ''}`}>
              <input
                type="text"
                list="stat-name-options"
                value={s.label}
                placeholder="스탯명"
                onChange={(e) => updateSub(s.id, 'label', e.target.value)}
              />
              <input
                type="text"
                value={s.valueText}
                placeholder="예: 7.5% 또는 40"
                onChange={(e) => updateSub(s.id, 'valueText', e.target.value)}
              />
              <button onClick={() => removeSub(s.id)} aria-label="서브 스탯 삭제">×</button>
            </li>
          ))}
        </ul>
        <datalist id="stat-name-options">
          {statOptions.map((opt) => <option key={opt} value={opt} />)}
        </datalist>
        {echo.subStats.length < 5 && (
          <button className="echo-panel__add" onClick={addSub}>+ 서브 스탯 추가</button>
        )}
      </section>
    </article>
  )
}
