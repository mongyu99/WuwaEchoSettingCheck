import { SUB_STAT_OPTIONS, SUB_STAT_NAMES, formatSubStatValue } from '../config/subStatOptions'
import { getEchoCost } from '../utils/ocr'
import './EchoPanel.css'

export default function EchoPanel({
  echo,
  index,
  onUpdateSubStats,
  highlightIncomplete,
  validLabels,
  suggestedStats,
  blinkLabel,
  blinkValue,
  blinkToken,
}) {
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
        {getEchoCost(echo) && <span className="echo-panel__cost">COST {getEchoCost(echo)}</span>}
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
            const incomplete = highlightIncomplete && (!s.label || !s.valueText)
            const isValidOption = s.label && validLabels?.includes(s.label)
            const isFlatValid = isValidOption && s.valueText && !s.valueText.includes('%')
            // 계산기가 추천한 "그 당시 상태"(라벨+수치)와 지금이 여전히 같을 때만 하늘색으로 표시합니다.
            // 라벨이든 수치든 사용자가 바꾸면 더 이상 추천 대상이 아니므로 자동으로 색이 풀립니다.
            const isSuggested =
              s.label && s.valueText && suggestedStats?.some((sug) => sug.label === s.label && sug.value === s.valueText)
            // 계산기 추천을 클릭한 직후, 그 자리를 잠깐 깜빡여서 어디로 이동했는지 알려줍니다. 같은
            // 자리가 다시 깜빡여도 재생되도록 key에 blinkToken을 섞어 그 순간 다시 마운트시킵니다.
            const isBlinking = blinkLabel && s.label === blinkLabel && s.valueText === blinkValue
            return (
              <li
                key={isBlinking ? `${s.id}-blink-${blinkToken}` : s.id}
                className={`echo-panel__sub-row ${s.highlighted ? 'echo-panel__sub-row--highlight' : ''} ${incomplete ? 'echo-panel__sub-row--incomplete' : ''} ${isValidOption ? (isFlatValid ? 'echo-panel__sub-row--valid-flat' : 'echo-panel__sub-row--valid') : ''} ${isSuggested ? 'echo-panel__sub-row--suggested' : ''} ${isBlinking ? 'echo-panel__sub-row--blink' : ''}`}
              >
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
