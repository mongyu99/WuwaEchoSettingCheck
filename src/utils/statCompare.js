// 캐릭터 추천: "지금 에코(캐릭터 빌드 체크에 저장한 것)"와 "추천 조합"이 주는 스탯을 비교합니다.
// 무기·캐릭터 기본 스탯은 양쪽이 같으므로 빼고, 에코(메인+서브) + 세트 효과 + 메인 에코 보너스만 더합니다.
import { getEchoSet } from '../config/echoSets'
import { getMainEcho } from '../config/mainEchoes'
import { applyCostToMainStats } from '../config/echoMainStats'

/** 비교할 카테고리(가방·빌드 체크의 옵션 이름에서 %를 뗀 이름으로 맞춥니다). 속성 피해는 캐릭터 속성만. */
function categories(element) {
  return [
    ['크리티컬', ['크리티컬']],
    ['크리티컬 피해', ['크리티컬 피해']],
    ['공격력', ['공격력']],
    ['HP', ['HP']],
    ['방어력', ['방어력']],
    ['공명 효율', ['공명 효율']],
    [`${element} 피해 보너스`, [`${element} 피해 보너스`, '속성 피해 보너스']],
    ['일반 공격 피해', ['일반 공격 피해', '일반 공격 피해 보너스']],
    ['강공격 피해', ['강공격 피해', '강공격 피해 보너스']],
    ['공명 스킬 피해', ['공명 스킬 피해', '공명 스킬 피해 보너스']],
    ['공명 해방 피해', ['공명 해방 피해', '공명 해방 피해 보너스']],
    ['에코 피해', ['에코 피해']],
  ]
}

/** 에코 목록 + 세트 조합 + 메인 에코로 카테고리별 % 합계·고정값 합계를 냅니다. */
export function buildStatTotals({ echoes, element, combo, mainEchoId, characterId }) {
  const cats = categories(element)
  const totals = Object.fromEntries(cats.map(([cat]) => [cat, { percent: 0, flat: 0 }]))
  const add = (label, value, isPercent) => {
    const base = label.replace(/%$/, '')
    const hit = cats.find(([, names]) => names.includes(base))
    if (!hit || Number.isNaN(value)) return
    totals[hit[0]][isPercent ? 'percent' : 'flat'] += value
  }

  for (const echo of echoes) {
    for (const s of [...echo.mainStats, ...echo.subStats]) {
      if (s.label && s.valueText) add(s.label, parseFloat(s.valueText), s.valueText.includes('%'))
    }
  }
  // 세트 효과: 낀 개수 이하 단계가 모두 적용(조건부라 수치가 없는 단계는 계산하지 않음).
  for (const { setId, pieceCount } of combo ?? []) {
    for (const [tier, piece] of Object.entries(getEchoSet(setId)?.pieces ?? {})) {
      if (Number(tier) > pieceCount) continue
      for (const b of piece.bonuses ?? []) add(b.category, b.value, true)
    }
  }
  const mainEcho = getMainEcho(mainEchoId)
  for (const b of mainEcho?.bonuses ?? []) add(b.category, b.value, true)
  if (mainEcho?.characterBonus?.characterIds.includes(characterId)) {
    for (const b of mainEcho.characterBonus.bonuses) add(b.category, b.value, true)
  }
  return totals
}

/** 가방 에코를 빌드 체크 에코 모양(메인 2줄 + 서브)으로 바꿉니다. */
export const bagItemAsEcho = (item) => ({
  mainStats: applyCostToMainStats([], Number(item.cost), item.main?.label),
  subStats: item.subStats,
})

/** 추천 조합에서 낀 세트 개수를 셉니다(세트 효과 계산용). */
export function comboFromPicks(picks) {
  const counts = {}
  for (const p of picks) if (p.item?.setId) counts[p.item.setId] = (counts[p.item.setId] ?? 0) + 1
  return Object.entries(counts).map(([setId, pieceCount]) => ({ setId, pieceCount }))
}

/** 두 합계를 비교해 바뀌는 줄만 돌려줍니다. [{ label, unit: '%'|'', before, after, diff }] */
export function diffTotals(before, after) {
  const rows = []
  for (const cat of Object.keys(after)) {
    for (const [key, unit] of [['percent', '%'], ['flat', '']]) {
      const b = before?.[cat]?.[key] ?? 0
      const a = after[cat][key]
      if (Math.abs(a) < 0.05 && Math.abs(b) < 0.05) continue
      rows.push({ label: unit ? cat : `${cat} (고정)`, unit, before: b, after: a, diff: a - b })
    }
  }
  return rows
}

/**
 * 실제 스탯(캐릭터 빌드 체크의 합산 스탯과 같은 방식): 에코 합계에 캐릭터 고유 보너스·무기를 더하고,
 * 공격력·HP·방어력은 기본값 × (1 + %) + 고정값, 크리티컬·공명 효율 등은 기본값 + % 로 냅니다.
 */
export function finalStats(totals, { baseStats, weapon, weaponRank, weaponBonusesAt }) {
  const t = structuredClone(totals)
  const addPercent = (category, value) => {
    const base = category.replace(/%$/, '')
    // "일반 공격 피해 보너스" → "일반 공격 피해" 줄, "속성 피해 보너스" → 캐릭터 속성 피해 줄
    const key = Object.keys(t).find(
      (cat) => cat === base || base === `${cat} 보너스` || (cat.endsWith('피해 보너스') && base === '속성 피해 보너스'),
    )
    if (key) t[key].percent += value
  }
  for (const b of baseStats?.innateBonuses ?? []) addPercent(b.category, b.value)
  if (weapon?.subStat) addPercent(weapon.subStat.category, weapon.subStat.value)
  for (const b of weapon ? weaponBonusesAt(weapon, weaponRank) : []) addPercent(b.category, b.value)

  const pct = (cat) => t[cat]?.percent ?? 0
  const flat = (cat) => t[cat]?.flat ?? 0
  const rows = [
    { label: 'HP', value: (baseStats?.hp ?? 0) * (1 + pct('HP') / 100) + flat('HP'), whole: true },
    { label: '공격력', value: ((baseStats?.atk ?? 0) + (weapon?.atk ?? 0)) * (1 + pct('공격력') / 100) + flat('공격력'), whole: true },
    { label: '방어력', value: (baseStats?.def ?? 0) * (1 + pct('방어력') / 100) + flat('방어력'), whole: true },
    { label: '공명 효율', value: (baseStats?.energyRegen ?? 0) + pct('공명 효율') },
    { label: '크리티컬', value: (baseStats?.critRate ?? 0) + pct('크리티컬') },
    { label: '크리티컬 피해', value: (baseStats?.critDmg ?? 0) + pct('크리티컬 피해') },
  ]
  for (const cat of Object.keys(t)) {
    if (['HP', '공격력', '방어력', '공명 효율', '크리티컬', '크리티컬 피해'].includes(cat)) continue
    rows.push({ label: cat, value: pct(cat) })
  }
  return rows
}
