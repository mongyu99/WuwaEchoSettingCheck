import { useEffect, useMemo, useState } from 'react'
import { scoreValidStats } from '../utils/echoScore'
import { probabilityAbove, sampleEchoScores } from '../utils/betterEchoOdds'
import './EchoOddsCard.css'

// 새 에코 하나를 +25까지 키워 서브 옵션 5칸을 다 여는 데 드는 튜너(칸당 10개). 돌려받는 튜너는 빼지 않은 대략값입니다.
const TUNERS_PER_ECHO = 50

/** 확률 p로 성공하는 시도를 평균 1/p번 해야 하므로, 평균 튜너 = 50 / p. */
function tunerText(p) {
  if (p < 0.001) return '거의 불가능'
  return `약 ${Math.round(TUNERS_PER_ECHO / p).toLocaleString()}개`
}

function percentText(p) {
  return p >= 0.001 ? `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%` : '0%'
}

/**
 * 교체 우선순위: 에코마다 "새 에코를 뽑으면 지금보다 점수가 높게 나올 확률"을 높은 순으로 보여 줍니다.
 * 에코 체크 화면(LiveCharacterCompare)과 같은 계산이라 두 화면 숫자가 같습니다. 줄을 누르면 그 에코로 이동합니다.
 */
export default function EchoOddsCard({ echoes, selectedIndex, validLabels, onSelect }) {
  // 새 에코 점수 분포는 유효 옵션이 바뀔 때만 다시 계산합니다.
  const [infoOpen, setInfoOpen] = useState(false)
  useEffect(() => {
    if (!infoOpen) return undefined
    const close = () => setInfoOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [infoOpen])
  const sampled = useMemo(() => sampleEchoScores(validLabels), [validLabels.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = echoes
    .map((echo, i) => ({ i, id: echo.id, p: probabilityAbove(sampled, scoreValidStats(echo.subStats, validLabels).total) }))
    .sort((a, b) => b.p - a.p)
  const selected = rows.find((row) => row.i === selectedIndex)

  return (
    <section className="echo-odds">
      <div className="echo-odds__head">
        <span className="echo-odds__title">교체 우선순위</span>
        {/* 오른쪽 i: 마우스를 올리거나 누르면 확률의 뜻을 보여 줍니다(아무 곳이나 누르면 닫힘). */}
        <button
          type="button"
          className={`echo-odds__info ${infoOpen ? 'echo-odds__info--on' : ''}`}
          aria-label="확률 안내"
          aria-expanded={infoOpen}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setInfoOpen((v) => !v)}
        >
          i
        </button>
        <div className="echo-odds__tip" role="tooltip">
          <p>지금보다 1점이라도 더 높게 뜰 확률이에요.</p>
          <p>이 점수가 딜을 보장해주진 않아요.</p>
        </div>
      </div>
      <p className="echo-odds__hint">지금보다 점수가 높게 나올 확률이에요.</p>
      <ol className="echo-odds__list">
        {rows.map((row, rank) => (
          <li key={row.id}>
            <button
              type="button"
              className={`echo-odds__row ${row.i === selectedIndex ? 'echo-odds__row--active' : ''}`}
              onClick={() => onSelect(row.i)}
            >
              <span className="echo-odds__name">에코 {row.i + 1}</span>
              <span className="echo-odds__bar">
                <span style={{ width: `${Math.max(row.p * 100, 1)}%` }} />
              </span>
              <strong>{percentText(row.p)}</strong>
              {rank === 0 && <em className="echo-odds__first">1순위</em>}
            </button>
          </li>
        ))}
      </ol>
      {selected && (
        <dl className="echo-odds__detail">
          <dt>좋은 에코까지</dt>
          <dd>
            <span>평균 튜너</span>
            <strong>{tunerText(selected.p)}</strong>
          </dd>
          <dd>
            <span>평균 강화할 에코</span>
            <strong>{selected.p < 0.001 ? '-' : `약 ${(1 / selected.p).toFixed(1)}개`}</strong>
          </dd>
        </dl>
      )}
    </section>
  )
}
