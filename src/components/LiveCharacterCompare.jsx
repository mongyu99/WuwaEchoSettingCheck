import { useEffect, useMemo, useState } from 'react'
import { getValidOptions } from '../config/characterValidOptions'
import { getCharacterEchoCombos } from '../config/characterEchoSets'
import { getMainEchoIdForCombo } from '../config/echoSetMainEchoes'
import { getCharacterBaseStats } from '../config/characterBaseStats'
import { getWeapon } from '../config/weapons'
import { weaponBonusesAt } from '../utils/weaponRank'
import { scoreValidStats } from '../utils/echoScore'
import { getEchoCost } from '../utils/ocr'
import { buildStatTotals, finalStats } from '../utils/statCompare'
import { probabilityAbove, sampleEchoScores } from '../utils/betterEchoOdds'
import { useCountUp } from '../utils/useCountUp'
import { gradeOf } from '../utils/echoScore'
import { assetPath } from '../config/assetPath'
import './LiveCharacterCompare.css'

/** 숫자가 바뀌면 이전 값에서 새 값까지 촤르륵 올라가는 표시(저장해서 점수·스탯이 오를 때). */
function CountUp({ value, format }) {
  const shown = useCountUp(value)
  return <>{format(shown)}</>
}

/**
 * 실시간 에코 체크 — 고른 캐릭터 기준 비교(오른쪽 칸).
 * 강화 중인 에코를 그 캐릭터가 끼고 있는 에코 한 자리와 바꿨을 때 점수와 실제 스탯(기본 스탯·무기 포함)이
 * 얼마나 바뀌는지 바로 보여 줍니다. 바꿀 자리는 같은 코스트 중 점수가 가장 낮은 자리로 자동으로 고르고,
 * 다른 자리를 눌러 바꿀 수 있습니다. 세트 효과·메인 에코는 지금 세팅 그대로 본다고 가정합니다.
 */
export default function LiveCharacterCompare({ character, echo, hasEcho = false, characterEchoes, characterData, onApply, onGoToSetup }) {
  const [slotOverride, setSlotOverride] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false) // 오른쪽 위 i: 점수·확률·비교 방법 설명
  const current = characterEchoes[character.id] ?? []
  const validLabels = getValidOptions(character.id)
  const scoreOf = (e) => scoreValidStats(e.subStats, validLabels).total
  // 새 에코 점수 분포(캐릭터마다 한 번만 계산) → 자리마다 "지금보다 높게 뜰 확률"
  const sampled = useMemo(() => sampleEchoScores(validLabels), [character.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 자동 자리: 같은 코스트 중 점수가 가장 낮은 자리(같은 코스트가 없으면 빈 자리 → 새로 추가)
  const cost = echo ? Number(getEchoCost(echo)) : null
  const autoSlot = useMemo(() => {
    if (!cost) return null
    const sameCost = current.map((e, i) => ({ i, cost: Number(getEchoCost(e)), score: scoreOf(e) })).filter((x) => x.cost === cost)
    if (sameCost.length) return sameCost.sort((a, b) => a.score - b.score)[0].i
    return current.length < 5 ? current.length : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, cost, current])
  // 캐릭터나 코스트가 바뀌면 직접 고른 자리는 풀고 다시 자동으로 고릅니다.
  useEffect(() => setSlotOverride(null), [character.id, cost])
  // 코스트가 다른 자리는 바꿀 수 없어서 고를 수 없게 합니다(코스트를 못 읽었으면 모든 자리를 열어 둡니다).
  const otherCost = (e) => !!cost && !!e && Number(getEchoCost(e)) !== cost
  const override = slotOverride !== null && otherCost(current[slotOverride]) ? null : slotOverride
  // 직접 누른 칸: 빈칸이면 표시는 누른 칸에, 저장·비교는 첫 빈칸으로(저장은 앞에서부터 채워짐).
  const slot = override === null ? autoSlot : current[override] ? override : current.length < 5 ? current.length : null
  const shownSlot = override ?? autoSlot

  const compare = useMemo(() => {
    if (!echo || slot === null) return null
    const rec = characterData[character.id]
    const combo = rec?.echoParts ?? getCharacterEchoCombos(character.id)?.[0] ?? []
    const mainEchoId = rec?.mainEchoId ?? getMainEchoIdForCombo(combo)
    const loadout = { baseStats: getCharacterBaseStats(character.id), weapon: getWeapon(rec?.weapon), weaponRank: rec?.weaponRank ?? 1, weaponBonusesAt }
    const stats = (echoes) =>
      finalStats(buildStatTotals({ echoes, element: character.element, combo, mainEchoId, characterId: character.id }), loadout)
    const next = [...current]
    next[slot] = echo
    const before = stats(current)
    // 빈 자리 어디에 넣어도 됩니다(저장은 앞에서부터 채워짐). 계산할 때는 빈칸을 뺍니다.
    const after = stats(next.filter(Boolean))
    return {
      beforeScore: current[slot] ? scoreOf(current[slot]) : 0,
      afterScore: scoreOf(echo),
      rows: before
        .map((b, i) => ({ ...b, after: after[i].value, diff: after[i].value - b.value }))
        // 안 바뀌는 스탯도 전체를 보여 줍니다(둘 다 0인 줄만 뺌).
        .filter((r) => Math.abs(r.value) >= 0.05 || Math.abs(r.after) >= 0.05),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, echo, slot, current, characterData])

  const fmt = (r, v) => (r.whole ? Math.floor(v).toLocaleString() : `${v.toFixed(1)}%`)
  const fmtDiff = (r) => `${r.diff > 0 ? '+' : ''}${r.whole ? Math.round(r.diff).toLocaleString() : `${r.diff.toFixed(1)}%`}`
  const diffScore = compare ? compare.afterScore - compare.beforeScore : 0

  return (
    <div className="live-compare">
      {/* 빌드 체크에 저장한 에코가 하나도 없으면 비교할 게 없어서, 먼저 세팅하러 가게 안내합니다. */}
      {current.length === 0 && (
        <div className="live-compare__empty">
          <p>{character.name}의 에코 세팅이 없어서 비교할 수 없어요.</p>
          {onGoToSetup && (
            <button type="button" className="btn btn--primary" onClick={() => onGoToSetup(character)}>
              세팅하러 가기 →
            </button>
          )}
        </div>
      )}
      <div className="live-compare__title-row">
        <p className="live-compare__title">이 에코로 바꾸면</p>
        <span className="live-compare__slot-note">
          {!cost && echo
            ? '코스트 미확인 · 같은 코스트 자리를 직접 골라 주세요'
            : slot !== null && (override === null ? '같은 코스트 중 점수가 가장 낮은 자리와 비교' : '고른 자리와 비교')}
        </span>
        <button
          type="button"
          className={`live-compare__info-btn ${infoOpen ? 'live-compare__info-btn--on' : ''}`}
          onClick={() => setInfoOpen((v) => !v)}
          aria-expanded={infoOpen}
          aria-label="계산 방법 보기"
        >
          i
        </button>
        {infoOpen && (
          <div className="live-compare__info" role="dialog" aria-label="계산 방법">
            <h4>점수</h4>
            <p>유효한 서브 옵션만 점수로 쳐요, 옵션마다 최대 20점, 수치가 높은 단계일수록 점수가 높아요. (고정 수치 옵션은 절반만 적용해요.)</p>
            <p>단순히 유효 옵션과 운에 기반한 점수에요. 어느 스탯이 더 좋은지에 대한 점수는 아니에요.</p>
            <h4>↑ 확률</h4>
            <p>새 에코를 띄웠을 때, 그 자리보다 유효 점수가 조금이라도 더 높게 나올 확률이에요. 공개 수치를 기반으로 확률을 측정했어요.</p>
          </div>
        )}
      </div>

      <div className="live-compare__slots" aria-label="바꿀 자리">
        {Array.from({ length: 5 }, (_, i) => {
          const e = current[i]
          const blocked = otherCost(e)
          return (
            <button
              key={i}
              type="button"
              className={`live-compare__slot ${shownSlot === i ? 'live-compare__slot--on' : ''} ${blocked ? 'live-compare__slot--blocked' : ''}`}
              onClick={() => setSlotOverride(i)}
              disabled={blocked}
              title={blocked ? `${getEchoCost(e)}코 자리라 ${cost}코 에코와 바꿀 수 없어요` : e ? `${getEchoCost(e)}코 · ${scoreOf(e).toFixed(1)}점` : '빈 자리'}
            >
              {/* 같은 코스트 중 점수가 가장 낮은 자리 = 바꾸기 추천(점수가 오를 때만) */}
              {autoSlot === i && echo && (!e || scoreOf(echo) > scoreOf(e)) && <span className="live-compare__rec">추천</span>}
              <small>{e ? `${getEchoCost(e)}코` : '빈칸'}</small>
              {/* 자리 점수: 저장해서 바뀌면 촤르륵 올라가고, 오른쪽에 등급 아이콘 */}
              <b className="live-compare__slot-score">
                {e ? <CountUp value={scoreOf(e)} format={(v) => v.toFixed(0)} /> : '-'}
                {e && (
                  <img
                    className="live-compare__grade"
                    src={assetPath(`grades/${gradeOf(scoreOf(e) * 5).icon}.png`)}
                    alt={gradeOf(scoreOf(e) * 5).label}
                    title={gradeOf(scoreOf(e) * 5).label}
                  />
                )}
              </b>
              {e && (() => {
                const p = probabilityAbove(sampled, scoreOf(e))
                return <em className="live-compare__odds">{p >= 0.001 ? `↑${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%` : '↑0%'}</em>
              })()}
            </button>
          )
        })}
      </div>


      {!echo ? (
        <p className="uploader__hint">{hasEcho ? '코스트를 못 읽었어요. 인식한 에코의 [수정]에서 코스트를 골라 주세요.' : '게임에서 에코를 띄우면 비교해 드려요.'}</p>
      ) : slot === null ? (
        <p className="uploader__hint">
          {cost ? `${cost}코 에코를 끼고 있지 않아요. 바꿀 자리를 위에서 골라 주세요.` : '코스트를 못 읽었어요. 같은 코스트 자리를 위에서 골라 비교해 보세요.'}
        </p>
      ) : (
        compare && (
          <>
            <div className={`live-compare__score ${diffScore >= 0 ? 'live-compare__score--up' : 'live-compare__score--down'}`}>
              <span>점수</span>
              <b>
                {compare.beforeScore.toFixed(1)} → {compare.afterScore.toFixed(1)}
              </b>
              <em>
                {diffScore >= 0 ? '+' : ''}
                {diffScore.toFixed(1)}
              </em>
            </div>
            {compare.rows.length === 0 ? (
              <p className="uploader__hint">바꿔도 스탯은 그대로예요.</p>
            ) : (
              <table className="live-compare__stats">
                {/* 칸을 나눠서 지금 값 · 화살표 · 바꾼 뒤 값 · 차이가 세로로 줄 맞춰 보이게 합니다. */}
                <thead>
                  <tr>
                    <th>스탯</th>
                    <th>지금</th>
                    <th aria-hidden="true" />
                    <th>바꾸면</th>
                    <th>차이</th>
                  </tr>
                </thead>
                <tbody>
                  {compare.rows.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td className="live-compare__num">{fmt(r, r.value)}</td>
                      <td className="live-compare__arrow">→</td>
                      <td className="live-compare__num">
                        <strong>{fmt(r, r.after)}</strong>
                      </td>
                      <td className={r.diff > 0.05 ? 'live-compare__up' : r.diff < -0.05 ? 'live-compare__down' : 'live-compare__same'}>
                        {Math.abs(r.diff) < 0.05 ? '-' : fmtDiff(r)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              type="button"
              className="btn btn--primary live-compare__apply"
              disabled={!cost}
              title={cost ? undefined : '코스트를 골라야 저장할 수 있어요.'}
              onClick={() => onApply(character, echo, slot)}
            >
              {cost ? '이 자리에 저장' : '코스트를 골라야 저장할 수 있어요'}
            </button>          </>
        )
      )}
    </div>
  )
}
