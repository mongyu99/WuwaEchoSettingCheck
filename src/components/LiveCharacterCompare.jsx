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
import './LiveCharacterCompare.css'

/**
 * 실시간 에코 체크 — 고른 캐릭터 기준 비교(오른쪽 칸).
 * 강화 중인 에코를 그 캐릭터가 끼고 있는 에코 한 자리와 바꿨을 때 점수와 실제 스탯(기본 스탯·무기 포함)이
 * 얼마나 바뀌는지 바로 보여 줍니다. 바꿀 자리는 같은 코스트 중 점수가 가장 낮은 자리로 자동으로 고르고,
 * 다른 자리를 눌러 바꿀 수 있습니다. 세트 효과·메인 에코는 지금 세팅 그대로 본다고 가정합니다.
 */
export default function LiveCharacterCompare({ character, echo, hasEcho = false, characterEchoes, characterData, onApply }) {
  const [slotOverride, setSlotOverride] = useState(null)
  const current = characterEchoes[character.id] ?? []
  const validLabels = getValidOptions(character.id)
  const scoreOf = (e) => scoreValidStats(e.subStats, validLabels).total

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
  const slot = slotOverride ?? autoSlot

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
      <p className="live-compare__title">이 에코로 바꾸면</p>

      <div className="live-compare__slots" aria-label="바꿀 자리">
        {Array.from({ length: 5 }, (_, i) => {
          const e = current[i]
          return (
            <button
              key={i}
              type="button"
              className={`live-compare__slot ${slot === i ? 'live-compare__slot--on' : ''}`}
              // 빈 자리는 순서가 의미 없어서(저장하면 앞에서부터 채워짐) 어느 빈칸을 눌러도 첫 빈칸으로 봅니다.
              onClick={() => setSlotOverride(e ? i : current.length)}
              title={e ? `${getEchoCost(e)}코 · ${scoreOf(e).toFixed(1)}점` : '빈 자리'}
            >
              <small>{e ? `${getEchoCost(e)}코` : '빈칸'}</small>
              <b>{e ? scoreOf(e).toFixed(0) : '-'}</b>
            </button>
          )
        })}
      </div>
      {slot !== null && <p className="live-compare__slot-note">{slotOverride === null ? '같은 코스트 중 점수가 가장 낮은 자리와 비교해요' : '고른 자리와 비교해요'}</p>}

      {!echo ? (
        <p className="uploader__hint">{hasEcho ? '코스트를 못 읽었어요. 인식한 에코의 [수정]에서 코스트를 골라 주세요.' : '게임에서 에코를 띄우면 비교해 드려요.'}</p>
      ) : slot === null ? (
        <p className="uploader__hint">{cost}코 에코를 끼고 있지 않아요. 바꿀 자리를 위에서 골라 주세요.</p>
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
                <tbody>
                  {compare.rows.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td>
                        {fmt(r, r.value)} → <strong>{fmt(r, r.after)}</strong>
                      </td>
                      <td className={r.diff > 0.05 ? 'live-compare__up' : r.diff < -0.05 ? 'live-compare__down' : 'live-compare__same'}>
                        {Math.abs(r.diff) < 0.05 ? '-' : fmtDiff(r)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button type="button" className="btn btn--primary live-compare__apply" onClick={() => onApply(character, echo, slot)}>
              이 자리에 저장
            </button>
          </>
        )
      )}
    </div>
  )
}
