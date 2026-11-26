import { useState } from 'react'
import { checkGoal } from '../utils/enhanceMission'
import { getValidOptions } from '../config/characterValidOptions'
import { scoreValidStats } from '../utils/echoScore'
import { swapFinalStats } from '../utils/statCompare'
import { getCharacterEchoCombos } from '../config/characterEchoSets'
import { getMainEchoIdForCombo } from '../config/echoSetMainEchoes'
import { getCharacterBaseStats } from '../config/characterBaseStats'
import { getWeapon } from '../config/weapons'
import { weaponBonusesAt } from '../utils/weaponRank'
import './EnhanceMissionCard.css'

const MARK = { ok: '✓', wait: '·', fail: '✗' }
const STAT_DEPS = { getCharacterEchoCombos, getMainEchoIdForCombo, getCharacterBaseStats, getWeapon, weaponBonusesAt }
const withUnit = (label, v) => (label.endsWith('%') ? `${v}%` : `${v}`)
const fmtStat = (r, v) => (r.whole ? Math.floor(v).toLocaleString() : `${v.toFixed(1)}%`)

/**
 * 에코 체크 오른쪽 위: 목표 스탯 계산기에서 가져온 강화 목표 목록.
 * 강화 중인 에코(echo)를 목표마다 대 보고, 다 채운 목표는 그 자리에 바로 저장할 수 있게 합니다.
 */
export default function EnhanceMissionCard({ mission, character, echo, currentEchoes = [], record = null, onSave, onClose }) {
  // 머리(제목)를 누르면 목표 목록을 접고 펼칩니다(× 는 목표 자체를 닫기).
  const [folded, setFolded] = useState(false)
  if (!mission || !character) return null
  // 지금 에코가 그 자리(목표의 에코 N)에 끼고 있는 에코보다 유효 점수가 높은지
  const validLabels = getValidOptions(character.id)
  const betterThanSlot = (index) => {
    const old = currentEchoes[index]
    if (!echo?.subStats || !old) return false
    return scoreValidStats(echo.subStats, validLabels).total > scoreValidStats(old.subStats, validLabels).total
  }
  // 조건 미달 이유: (1) 옵션은 붙었는데 수치가 모자람 (2) 이 에코로 바꾸면 목표 스탯이 떨어짐(오를 때는 안 보여 줌)
  const goalStats = mission.category.split(' · ')
  const failReasons = (goal, result) => {
    const short = [...result.targets, ...result.keep]
      .filter((x) => x.state === 'fail' && x.got && x.min != null)
      .map((x) => `${x.label.replace(/%$/, '')} ${x.got} 붙었지만, 목표까지 ${withUnit(x.label, x.min)} 이상 필요해요.`)
    let drops = []
    if (echo?.mainStats?.length && currentEchoes.length) {
      try {
        drops = swapFinalStats({ character, record, current: currentEchoes, slot: goal.echoIndex, echo, deps: STAT_DEPS })
          .filter((r) => goalStats.includes(r.label) && r.after < r.value - 0.05)
          .map((r) => `이 에코로 바꾸면 ${r.label} ${fmtStat(r, r.value)} → ${fmtStat(r, r.after)}로 떨어져요.`)
      } catch {
        drops = []
      }
    }
    return [...short, ...drops]
  }
  const remaining = mission.goals.filter((g) => !g.done).length
  const otherCost = echo?.cost ? mission.goals.filter((g) => !g.done && Number(echo.cost) !== g.cost).length : 0

  return (
    <section className="mission">
      <div className="mission__head">
        <button type="button" className="mission__toggle" onClick={() => setFolded((v) => !v)} aria-expanded={!folded}>
          <strong>{character.name} 강화 목표</strong>
          <small>
            {mission.category} 올리기 · 남은 목표 {remaining}개
          </small>
          <i className={`mission__chevron ${folded ? '' : 'mission__chevron--open'}`} aria-hidden="true">▾</i>
        </button>
        <button type="button" className="mission__close" onClick={onClose} aria-label="강화 목표 닫기">
          ×
        </button>
      </div>
      {!folded && (
      <>
      <p className="mission__hint">지금 끼고 있는 에코 옵션은 바꿀 수 없어요. 아래 조건이 붙은 새 에코를 강화해서 띄워 주세요.</p>

      {otherCost > 0 && (
        <p className="mission__other-cost">
          지금 에코({echo.cost}코)와 코스트가 다른 목표 {otherCost}개는 숨겼어요.
        </p>
      )}
      <ol className="mission__goals">
        {mission.goals.map((goal, i) => {
          const result = echo ? checkGoal(goal, { cost: echo.cost, subStats: echo.subStats }) : null
          // 코스트가 다른 목표는 이 에코로 채울 수 없어서 목록에서 뺍니다(위에 개수만 안내).
          if (!goal.done && result?.costState === 'fail') return null
          return (
            <li key={i} className={`mission__goal ${goal.done ? 'mission__goal--done' : ''} ${result ? `mission__goal--${result.status}` : ''}`}>
              <div className="mission__goal-head">
                <b>
                  에코 {goal.echoIndex + 1} 대신 · {goal.cost}코
                </b>
                <small>
                  {goal.done ? '저장 완료' : `뜰 확률 ${goal.probability >= 0.01 ? goal.probability.toFixed(2) : goal.probability.toPrecision(2)}% · 약 ${Math.round(goal.attempts).toLocaleString()}개 중 1개`}
                </small>
              </div>
              {!goal.done && (
                <ul className="mission__checks">
                  {goal.targets.map((t) => {
                    const st = result?.targets.find((x) => x.label === t.label)
                    return (
                      <li key={`t-${t.label}`} className={`mission__check mission__check--${st?.state ?? 'wait'}`}>
                        <i>{MARK[st?.state ?? 'wait']}</i>
                        {t.label} {t.label.endsWith('%') ? `${t.min}%` : t.min} 이상
                        {st?.got && <em>(지금 {st.got})</em>}
                      </li>
                    )
                  })}
                  {goal.keep.map((k) => {
                    const label = typeof k === 'string' ? k : k.label
                    const min = typeof k === 'string' ? null : k.min
                    const st = result?.keep.find((x) => x.label === label)
                    return (
                      <li key={`k-${label}`} className={`mission__check mission__check--${st?.state ?? 'wait'}`}>
                        <i>{MARK[st?.state ?? 'wait']}</i>
                        {min === null ? `${label} 붙어 있기` : `${label} ${label.endsWith('%') ? `${min}%` : min} 이상 (유지)`}
                        {st?.got && <em>(지금 {st.got})</em>}
                      </li>
                    )
                  })}
                  {result && result.costState === 'fail' && <li className="mission__check mission__check--fail">✗ 코스트가 달라요({goal.cost}코여야 해요)</li>}
                </ul>
              )}
              {!goal.done && result?.status === 'ok' && (
                <button type="button" className="btn btn--primary mission__save" onClick={() => onSave(i)}>
                  목표 달성! 에코 {goal.echoIndex + 1} 자리에 저장
                </button>
              )}
              {!goal.done && result?.status === 'fail' && <p className="mission__fail">이 에코는 조건 미달이에요. 다음 에코로 가요.</p>}
              {!goal.done && result?.status === 'fail' && result.costState === 'ok' && (() => {
                const reasons = failReasons(goal, result)
                return reasons.length > 0 && (
                  <ul className="mission__reasons">
                    {reasons.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                )
              })()}
              {/* 조건은 못 채웠어도 그 자리 지금 에코보다 점수가 높으면, 버리기 전에 한 번 더 보게 알려 줍니다. */}
              {!goal.done && result?.status === 'fail' && result.costState === 'ok' && betterThanSlot(goal.echoIndex) && (
                <p className="mission__notice">점수가 기존 에코보다 높아요. 다만 교체 시 목표 수치가 달라질 수 있으니 다시 계산해주세요.</p>
              )}
            </li>
          )
        })}
      </ol>
      </>
      )}
    </section>
  )
}
