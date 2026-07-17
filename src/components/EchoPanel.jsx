import { SUB_STAT_OPTIONS, SUB_STAT_NAMES, formatSubStatValue } from '../config/subStatOptions'
import './EchoPanel.css'

export default function EchoPanel({ echo, index, onUpdateSubStats }) {
  const updateSubLabel = (id, label) => {
    onUpdateSubStats(
      echo.id,
      echo.subStats.map((s) => (s.id === id ? { ...s, label, valueText: '' } : s)),
    )
  }
  const updateSubValue = (id, valueText) => {
    onUpdateSubStats(echo.id, echo.subStats.map((s) => (s.id === id ? { ...s, valueText } : s)))
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
        <span className="echo-panel__badge">에코 {index + 1}</span>
      </header>

      {echo.failed && <p className="echo-panel__failed">이 사진은 인식에 실패했어요. 값을 직접 선택해주세요.</p>}

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
          {echo.subStats.map((s) => {
            const usedLabels = echo.subStats.map((o) => o.label).filter(Boolean)
            const options = SUB_STAT_NAMES.filter((name) => name === s.label || !usedLabels.includes(name))
            return (
              <li key={s.id} className={`echo-panel__sub-row ${s.highlighted ? 'echo-panel__sub-row--highlight' : ''}`}>
                <select value={s.label} onChange={(e) => updateSubLabel(s.id, e.target.value)}>
                  <option value="">스탯 선택</option>
                  {options.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <select
                  value={s.valueText}
                  onChange={(e) => updateSubValue(s.id, e.target.value)}
                  disabled={!s.label}
                >
                  <option value="">수치 선택</option>
                  {s.label && SUB_STAT_OPTIONS[s.label].map((num) => {
                    const text = formatSubStatValue(s.label, num)
                    return <option key={text} value={text}>{text}</option>
                  })}
                </select>
                <button onClick={() => removeSub(s.id)} aria-label="서브 스탯 삭제">×</button>
              </li>
            )
          })}
        </ul>
        {echo.subStats.length < 5 && (
          <button className="echo-panel__add" onClick={addSub}>+ 서브 스탯 추가</button>
        )}
      </section>
    </article>
  )
}
