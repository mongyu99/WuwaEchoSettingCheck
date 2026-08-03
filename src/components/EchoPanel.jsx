import { SUB_STAT_OPTIONS, SUB_STAT_NAMES, formatSubStatValue } from '../config/subStatOptions'
import { MAIN_STAT_BONUS_NAMES } from '../config/mainStatBonusNames'
import { getEchoCost } from '../utils/ocr'
import './EchoPanel.css'

// 메인 스탯은 항상 최대 2줄입니다: 첫 줄은 코스트 보너스(15가지 중 하나), 둘째 줄은 공격력/HP
// 중 하나입니다(utils/ocr.js의 normalizeMainStats와 같은 규칙). 값(valueText)은 코스트별로
// 고정돼 있지만 아직 그 수치 테이블이 없어서, 지금은 라벨만 목록에서 고르고 값은 직접 입력합니다.
const MAIN_STAT_LABEL_OPTIONS = [MAIN_STAT_BONUS_NAMES, ['공격력', 'HP']]

export default function EchoPanel({
  echo,
  index,
  onUpdateSubStats,
  onUpdateMainStats,
  highlightIncomplete,
  validLabels,
  suggestedStats,
  blinkLabel,
  blinkValue,
  blinkToken,
}) {
  const updateMainLabel = (id, label) => {
    onUpdateMainStats(echo.id, echo.mainStats.map((s) => (s.id === id ? { ...s, label } : s)))
  }
  const updateMainValue = (id, valueText) => {
    onUpdateMainStats(echo.id, echo.mainStats.map((s) => (s.id === id ? { ...s, valueText } : s)))
  }
  const removeMain = (id) => {
    onUpdateMainStats(echo.id, echo.mainStats.filter((s) => s.id !== id))
  }
  const addMain = () => {
    if (echo.mainStats.length >= 2) return
    onUpdateMainStats(echo.id, [...echo.mainStats, { id: `main-${Date.now()}`, label: '', valueText: '' }])
  }

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
          {echo.mainStats.map((s, i) => {
            const labelOptions = MAIN_STAT_LABEL_OPTIONS[i] ?? MAIN_STAT_BONUS_NAMES
            const labelIncomplete = highlightIncomplete && !s.label
            const valueIncomplete = highlightIncomplete && !!s.label && !s.valueText
            return (
              <li key={s.id} className="echo-panel__main-row">
                <select
                  className={labelIncomplete ? 'echo-panel__sub-row--incomplete' : ''}
                  value={s.label}
                  onChange={(e) => updateMainLabel(s.id, e.target.value)}
                >
                  <option value="" disabled hidden>스탯 선택</option>
                  {labelOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <input
                  className={valueIncomplete ? 'echo-panel__sub-row--incomplete' : ''}
                  type="text"
                  value={s.valueText}
                  onChange={(e) => updateMainValue(s.id, e.target.value)}
                  placeholder="수치 직접 입력"
                  disabled={!s.label}
                />
                <button onClick={() => removeMain(s.id)} aria-label="메인 스탯 삭제">×</button>
              </li>
            )
          })}
        </ul>
        {echo.mainStats.length < 2 && (
          <button className="echo-panel__add" onClick={addMain}>+ 메인 스탯 추가</button>
        )}
      </section>

      <section className="echo-panel__block echo-panel__block--sub">
        <h3>서브 스탯 <span className="echo-panel__count">{echo.subStats.length}/5</span></h3>
        <ul>
          {echo.subStats.length === 0 && <li className="echo-panel__empty">서브 스탯 없음</li>}
          {echo.subStats.map((s) => {
            const usedLabels = echo.subStats.map((o) => o.label).filter(Boolean)
            const options = SUB_STAT_NAMES.filter((name) => name === s.label || !usedLabels.includes(name))
            const labelIncomplete = highlightIncomplete && !s.label
            const valueIncomplete = highlightIncomplete && !!s.label && !s.valueText
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
                className={`echo-panel__sub-row ${s.highlighted ? 'echo-panel__sub-row--highlight' : ''} ${isValidOption ? (isFlatValid ? 'echo-panel__sub-row--valid-flat' : 'echo-panel__sub-row--valid') : ''} ${isSuggested ? 'echo-panel__sub-row--suggested' : ''} ${isBlinking ? 'echo-panel__sub-row--blink' : ''}`}
              >
                <select
                  className={labelIncomplete ? 'echo-panel__sub-row--incomplete' : ''}
                  value={s.label}
                  onChange={(e) => updateSubLabel(s.id, e.target.value)}
                >
                  {/* 새로 추가된 자리에서만 보이는 안내용 자리표시자로, 한 번 스탯을 고르면 다시
                      선택할 수 없도록 목록에서 빼둡니다(disabled+hidden). */}
                  <option value="" disabled hidden>스탯 선택</option>
                  {options.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <select
                  className={valueIncomplete ? 'echo-panel__sub-row--incomplete' : ''}
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
