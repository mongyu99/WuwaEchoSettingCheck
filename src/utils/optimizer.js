import { SUB_STAT_OPTIONS } from '../config/subStatOptions'
import { echoMultiTargetProbability, echoSuccessProbability, expectedAttempts } from './probability'

// (기준값 + %) 형태로 계산해야 하는 카테고리와, %만으로 계산되는 카테고리
export const BASE_PERCENT_CATEGORIES = {
  공격력: { percentLabel: '공격력%', flatLabel: '공격력' },
  방어력: { percentLabel: '방어력%', flatLabel: '방어력' },
  HP: { percentLabel: 'HP%', flatLabel: 'HP' },
}
export const PERCENT_ONLY_CATEGORIES = {
  '공명 효율': { percentLabel: '공명 효율%' },
  크리티컬: { percentLabel: '크리티컬%' },
  '크리티컬 피해': { percentLabel: '크리티컬 피해%' },
  // 에코 서브 옵션으로 챙길 수 있는 피해 보너스도 목표로 넣을 수 있습니다.
  '일반 공격 피해': { percentLabel: '일반 공격 피해 보너스%' },
  '강공격 피해': { percentLabel: '강공격 피해 보너스%' },
  '공명 스킬 피해': { percentLabel: '공명 스킬 피해 보너스%' },
  '공명 해방 피해': { percentLabel: '공명 해방 피해 보너스%' },
}
export const OPTIMIZER_CATEGORIES = { ...BASE_PERCENT_CATEGORIES, ...PERCENT_ONLY_CATEGORIES }

// 공격력/방어력/HP는 %와 플랫이 둘 다 유효 옵션 목록에 들어있는 경우가 많은데, 그중 플랫 쪽은
// "2순위"로 취급합니다 — %만 유효 옵션인 캐릭터에게는 이 규칙이 적용되지 않습니다(플랫도 그냥
// 무효 옵션이라 기존 로직대로 처리됨).
const SECONDARY_FLAT_TO_PERCENT = { 공격력: '공격력%', 방어력: '방어력%', HP: 'HP%' }

/** 이 라벨이 "2순위"(예: %가 유효 옵션인 캐릭터의 플랫 스탯)인지 판단합니다. */
function isSecondaryLabel(label, validLabels) {
  const percentCounterpart = SECONDARY_FLAT_TO_PERCENT[label]
  return percentCounterpart != null && validLabels.includes(percentCounterpart)
}

/**
 * 이 에코에서 새 스탯을 위해 뺄 자리를 찾습니다. 완전히 무효인 옵션을 최우선으로 찾고, 없으면
 * "2순위"(예: %가 유효 옵션인 캐릭터의 플랫 스탯) 자리를 대신 교체 대상으로 씁니다.
 */
function findReplaceableStat(echo, validLabels) {
  const invalid = echo.subStats.find((s) => s.label && s.valueText && !validLabels.includes(s.label))
  if (invalid) return invalid
  return echo.subStats.find((s) => s.label && s.valueText && isSecondaryLabel(s.label, validLabels))
}

/**
 * sourceLabel(% 서브스탯)을 가진 서브스탯 중, 빼도 marginBudget(퍼센트 포인트) 이내라서 목표를
 * 계속 달성한 상태로 남는 것들 중 가장 큰 값을 재배치 후보로 고릅니다(여유분을 최대한 활용).
 * 그런 서브스탯이 여러 에코에 있으면 값이 가장 큰 것 하나만 반환합니다.
 */
export function findReallocationCandidate(sourceLabel, marginBudget, echoes) {
  let best = null
  echoes.forEach((echo, echoIndex) => {
    echo.subStats.forEach((s) => {
      if (s.label !== sourceLabel) return
      const value = parseFloat(s.valueText)
      if (Number.isNaN(value) || value > marginBudget) return
      if (!best || value > best.value) best = { echoIndex, value, valueText: s.valueText }
    })
  })
  return best
}

/**
 * 에코를 "먼저 건드릴 순서"로 정렬합니다: 유효 옵션이 가장 적게 채워진 에코 먼저, 같으면 서브스탯
 * 값 합계가 가장 낮은 에코 먼저.
 */
function priorityOrder(echoes, validLabels) {
  return echoes
    .map((echo, index) => {
      const validCount = echo.subStats.filter((s) => s.label && s.valueText && validLabels.includes(s.label)).length
      const totalValue = echo.subStats.reduce((sum, s) => {
        const n = parseFloat(s.valueText)
        return sum + (Number.isNaN(n) ? 0 : n)
      }, 0)
      return { echo, index, validCount, totalValue }
    })
    .sort((a, b) => a.validCount - b.validCount || a.totalValue - b.totalValue)
}

/** options(오름차순) 중, remaining을 채우기에 충분한 가장 작은 값을 찾습니다. 없으면 최댓값. */
function pickSufficientTier(options, remaining) {
  const sufficient = options.find((v) => v >= remaining)
  return sufficient ?? options[options.length - 1]
}

/**
 * 새 에코가 지켜야 할 기존 유효 옵션 개수입니다. 수치까지 적힌 유효 옵션만 셉니다 — 라벨만 있고
 * 수치가 빈 옵션(예: 크리티컬 빈값)은 안 쓰는 옵션으로 보고 조건에서 뺍니다. excluded는 이번에
 * 바꾸는 자리라 셈에서 제외합니다.
 */
function requiredStatCount(echo, validLabels, excluded) {
  return echo.subStats.filter((s) => s !== excluded && s.label && s.valueText && validLabels.includes(s.label))
    .length
}

/**
 * 한 에코에서 부족분을 채울 수 있는 방법(후보)을 전부 만듭니다. 서브스탯은 이미 붙은 걸 바꿀 수
 * 없으므로, 각 후보의 probability는 "기존 유효 옵션을 전부 유지하면서 이 옵션이 필요한 단계 이상으로
 * 붙은 에코가 새로 뜰 확률"입니다.
 * - percent: 빈 자리/무효 자리에 %스탯을 새로 채움
 * - flat: 같은 자리에 플랫 스탯(2순위)을 채움
 * - upgrade: 이미 있는 낮은 단계 %스탯을 더 높은 단계로 다시 띄움
 */
function buildCandidates({ echo, validLabels, info, options, flatOptions, remainingPercent, base }) {
  const candidates = []
  const percentStat = echo.subStats.find((s) => s.label === info.percentLabel && s.valueText)
  const hasFlat = info.flatLabel && echo.subStats.some((s) => s.label === info.flatLabel && s.valueText)

  const filledCount = echo.subStats.filter((s) => s.label && s.valueText).length
  const replaceable = filledCount < 5 ? null : findReplaceableStat(echo, validLabels)
  const slot = filledCount < 5 ? { action: 'add' } : replaceable ? { action: 'replace', from: replaceable } : null

  if (slot) {
    const slotFields =
      slot.action === 'replace'
        ? { action: 'replace', fromLabel: slot.from.label, fromValue: slot.from.valueText }
        : { action: 'add' }
    const required = requiredStatCount(echo, validLabels, slot.from)

    if (!percentStat) {
      const tier = pickSufficientTier(options, remainingPercent)
      candidates.push({
        ...slotFields,
        label: info.percentLabel,
        toValue: `${tier}%`,
        gain: tier,
        gainIsFlat: false,
        probability: echoSuccessProbability(required, info.percentLabel, tier),
      })
    }

    if (info.flatLabel && !hasFlat && flatOptions.length && base > 0) {
      const tier = pickSufficientTier(flatOptions, (remainingPercent / 100) * base)
      candidates.push({
        ...slotFields,
        label: info.flatLabel,
        toValue: `${tier}`,
        gain: tier,
        gainIsFlat: true,
        probability: echoSuccessProbability(required, info.flatLabel, tier),
      })
    }
  }

  const currentValue = percentStat ? parseFloat(percentStat.valueText) : NaN
  if (!Number.isNaN(currentValue) && currentValue < options[options.length - 1]) {
    const tier = pickSufficientTier(
      options.filter((v) => v > currentValue),
      currentValue + remainingPercent,
    )
    candidates.push({
      action: 'upgrade',
      label: info.percentLabel,
      fromValue: percentStat.valueText,
      toValue: `${tier}%`,
      gain: tier - currentValue,
      gainIsFlat: false,
      probability: echoSuccessProbability(requiredStatCount(echo, validLabels, percentStat), info.percentLabel, tier),
    })
  }

  // 확률이 0인 단계(예: 확률표에 0으로 적힌 플랫 최고 단계)는 아무리 띄워도 안 나오므로 뺍니다.
  return candidates
    .filter((c) => c.probability > 0)
    .map((c) => ({ ...c, attempts: expectedAttempts(c.probability) }))
    .sort((a, b) => b.probability - a.probability)
}

/**
 * 목표까지 남은 값(gapValue, 이미 "합산 스탯"의 현재 총합 기준으로 계산된 부족분)을 채우려면
 * 어떤 에코의 어떤 자리를 바꿔야 하는지 계산합니다.
 * 에코를 priorityOrder 순서로 돌면서, 에코마다 가능한 방법(빈/무효 자리에 % 채우기, 같은 자리에
 * 플랫 2순위 채우기, 낮은 단계 %를 높은 단계로 다시 띄우기)을 "그런 에코가 새로 뜰 확률"로 비교해
 * 가장 높은 것을 추천하고, 두 번째를 alt로 함께 보여줍니다. 진짜 1순위 유효 옵션(2순위가 아닌 것)은
 * 교체 대상으로 절대 건드리지 않습니다. 각 방법은 "그 시점에 남은 필요량을 채우는 가장 낮은 단계"를
 * 목표로 잡습니다. 정확한 조합 최적화는 아니고 근사치입니다.
 *
 * @param base HP·공격력·방어력처럼 기준값에 곱해서 계산하는 카테고리는 그 기준값(캐릭터+무기 등
 *   합산 스탯에서 쓴 것과 동일). 공명 효율·크리티컬·크리티컬 피해처럼 그냥 더하는 카테고리는 null.
 */
export function runOptimizerFromGap({ category, gapValue, base, echoes, validLabels }) {
  const info = OPTIMIZER_CATEGORIES[category]
  if (!info) return null
  if (gapValue <= 0) return { achieved: true, steps: [] }

  const isBasePercent = category in BASE_PERCENT_CATEGORIES
  const neededPercentTotal = isBasePercent ? (base > 0 ? (gapValue / base) * 100 : null) : gapValue
  if (neededPercentTotal === null) return { achieved: false, steps: [], impossible: true, neededPercentTotal: 0 }

  const options = SUB_STAT_OPTIONS[info.percentLabel] ?? []
  if (!options.length) return { achieved: false, steps: [], impossible: true, neededPercentTotal }
  const flatOptions = info.flatLabel ? SUB_STAT_OPTIONS[info.flatLabel] ?? [] : []

  const steps = []
  let remainingPercent = neededPercentTotal

  for (const { echo, index } of priorityOrder(echoes, validLabels)) {
    if (remainingPercent <= 0) break
    const [primary, alt] = buildCandidates({ echo, validLabels, info, options, flatOptions, remainingPercent, base })
    if (!primary) continue
    steps.push({ echoIndex: index, ...primary, alt: alt ?? null })
    // 플랫이 선택됐으면 다시 퍼센트 단위로 환산해서 빼야 이후 반복의 남은 필요량 계산이 맞습니다.
    remainingPercent -= primary.gainIsFlat ? (primary.gain / base) * 100 : primary.gain
  }

  return {
    achieved: false,
    neededPercentTotal,
    steps,
    impossible: steps.length === 0 || remainingPercent > 0.01,
    remainingPercent: Math.max(0, Math.round(remainingPercent * 100) / 100),
  }
}

/**
 * 한 에코에서 할 수 있는 교체를 단계별로 전부 만듭니다(부족분과 관계없이 6.4%·7.1%·…·최고 단계 각각).
 * gainPercent는 % 단위로 맞춘 증가량(플랫은 기준값으로 환산)입니다.
 * 증가량이 같거나 더 크면서 시도 횟수도 같거나 적은 후보가 있으면 뺍니다(어차피 고를 일이 없음).
 */
function allCandidates({ echo, validLabels, info, options, flatOptions, base }) {
  const list = []
  const percentStat = echo.subStats.find((s) => s.label === info.percentLabel && s.valueText)
  const hasFlat = info.flatLabel && echo.subStats.some((s) => s.label === info.flatLabel && s.valueText)
  const filledCount = echo.subStats.filter((s) => s.label && s.valueText).length
  const replaceable = filledCount < 5 ? null : findReplaceableStat(echo, validLabels)
  const slot = filledCount < 5 ? { action: 'add' } : replaceable ? { action: 'replace', from: replaceable } : null

  if (slot) {
    const slotFields =
      slot.action === 'replace' ? { action: 'replace', fromLabel: slot.from.label, fromValue: slot.from.valueText } : { action: 'add' }
    const required = requiredStatCount(echo, validLabels, slot.from)
    if (!percentStat) {
      for (const tier of options) {
        list.push({ ...slotFields, label: info.percentLabel, toValue: `${tier}%`, gain: tier, gainIsFlat: false, gainPercent: tier,
          probability: echoSuccessProbability(required, info.percentLabel, tier) })
      }
    }
    if (info.flatLabel && !hasFlat && base > 0) {
      for (const tier of flatOptions) {
        list.push({ ...slotFields, label: info.flatLabel, toValue: `${tier}`, gain: tier, gainIsFlat: true, gainPercent: (tier / base) * 100,
          probability: echoSuccessProbability(required, info.flatLabel, tier) })
      }
    }
  }
  const currentValue = percentStat ? parseFloat(percentStat.valueText) : NaN
  if (!Number.isNaN(currentValue)) {
    const required = requiredStatCount(echo, validLabels, percentStat)
    for (const tier of options.filter((v) => v > currentValue)) {
      list.push({ action: 'upgrade', label: info.percentLabel, fromValue: percentStat.valueText, toValue: `${tier}%`,
        gain: tier - currentValue, gainIsFlat: false, gainPercent: tier - currentValue,
        probability: echoSuccessProbability(required, info.percentLabel, tier) })
    }
  }
  // 한 에코에서 두 군데를 같이: 공격력%를 더 높은 단계로 다시 띄우면서, 빈/무효 자리에 깡공격력도 같이 붙는 에코.
  // (민맥싱만으로는 증가량이 작고, 깡만으로는 높은 단계가 잘 안 떠서, 둘을 한 번에 노리는 게 나을 때가 많습니다.)
  if (slot && percentStat && info.flatLabel && !hasFlat && base > 0) {
    const required = echo.subStats.filter(
      (s) => s !== percentStat && s !== slot.from && s.label && s.valueText && validLabels.includes(s.label),
    ).length
    for (const tier of options.filter((v) => v > currentValue)) {
      for (const flat of flatOptions) {
        list.push({
          action: 'combo',
          label: info.percentLabel,
          fromValue: percentStat.valueText,
          toValue: `${tier}%`,
          slotAction: slot.action,
          slotFromLabel: slot.from?.label ?? null,
          slotFromValue: slot.from?.valueText ?? null,
          flatLabel: info.flatLabel,
          flatToValue: `${flat}`,
          gain: tier - currentValue + (flat / base) * 100,
          gainIsFlat: false,
          gainPercent: tier - currentValue + (flat / base) * 100,
          probability: echoMultiTargetProbability(required, [
            { label: info.percentLabel, value: tier },
            { label: info.flatLabel, value: flat },
          ]),
        })
      }
    }
  }
  return list.filter((c) => c.probability > 0).map((c) => ({ ...c, attempts: expectedAttempts(c.probability) }))
}

/** 증가량이 같거나 더 크면서 시도 횟수도 같거나 적은 후보가 있으면 뺍니다(어차피 고를 일이 없음). */
const pruneDominated = (list) =>
  list.filter(
    (c) => !list.some((o) => o !== c && o.gainPercent >= c.gainPercent && o.attempts <= c.attempts && (o.gainPercent > c.gainPercent || o.attempts < c.attempts)),
  )

/**
 * 후보들로 부족분(needed, % 단위)을 채우는 조합을 찾습니다(에코마다 많아야 한 번).
 * fast: 평균 시도 횟수 합 최소 / safe: 가장 어려운 교체의 확률 최대. 못 채우면 둘 다 null이고 maxGain(최대로 올릴 수 있는 양)을 돌려줍니다.
 */
function searchPlans(perEcho, needed) {
  const maxGainAfter = perEcho.map((_, i) => perEcho.slice(i).reduce((sum, e) => sum + Math.max(...e.cands.map((c) => c.gainPercent)), 0))
  const maxGain = maxGainAfter[0] ?? 0
  const done = (gain) => gain >= needed - 0.01
  let fast = null
  let safe = null
  const chosen = []
  const walk = (i, gain, attempts, minProb) => {
    if (done(gain)) {
      if (!fast || attempts < fast.totalAttempts) fast = { steps: [...chosen], totalAttempts: attempts, minProbability: minProb }
      if (!safe || minProb > safe.minProbability || (minProb === safe.minProbability && attempts < safe.totalAttempts)) {
        safe = { steps: [...chosen], totalAttempts: attempts, minProbability: minProb }
      }
      return
    }
    if (i >= perEcho.length || gain + maxGainAfter[i] < needed - 0.01) return
    // 두 계획 모두 이미 찾은 것보다 나쁠 수밖에 없는 갈래는 멈춥니다.
    if (fast && safe && attempts >= fast.totalAttempts && minProb < safe.minProbability) return
    walk(i + 1, gain, attempts, minProb)
    for (const c of perEcho[i].cands) {
      chosen.push({ echoIndex: perEcho[i].index, ...c })
      walk(i + 1, gain + c.gainPercent, attempts + c.attempts, Math.min(minProb, c.probability))
      chosen.pop()
    }
  }
  walk(0, 0, 0, Infinity)
  return { fast, safe, maxGain }
}

// 비교용 방법: 민맥싱(% 옵션만) / 깡(고정 수치만) / 섞어서(전부, 한 에코에 둘 다 포함)
const STRATEGIES = {
  minmax: (c, info) => c.action !== 'combo' && c.label === info.percentLabel,
  flat: (c) => c.action !== 'combo' && c.gainIsFlat,
  mixed: () => true,
}

/**
 * 목표까지 남은 값을 채우는 계획 두 가지를 만듭니다(에코마다 많아야 한 번 교체).
 * - fast(빠른 계획): 평균 시도 횟수 합이 가장 적은 조합. 작은 교체 여러 번보다 큰 교체 한 번이 적으면 그쪽.
 * - safe(안정적인 계획): 가장 어려운 교체의 확률이 가장 높은 조합(같으면 시도 횟수 합이 적은 쪽).
 * 모든 조합을 비교하되, 이미 찾은 계획보다 나빠지는 갈래는 더 보지 않습니다.
 */
export function planOptimizerFromGap({ category, gapValue, base, echoes, validLabels }) {
  const info = OPTIMIZER_CATEGORIES[category]
  if (!info) return null
  if (gapValue <= 0) return { achieved: true, fast: null, safe: null }
  const isBasePercent = category in BASE_PERCENT_CATEGORIES
  const needed = isBasePercent ? (base > 0 ? (gapValue / base) * 100 : null) : gapValue
  const options = SUB_STAT_OPTIONS[info.percentLabel] ?? []
  if (needed === null || !options.length) return { achieved: false, fast: null, safe: null, impossible: true, neededPercentTotal: needed ?? 0 }
  const flatOptions = info.flatLabel ? SUB_STAT_OPTIONS[info.flatLabel] ?? [] : []

  const all = echoes.map((echo, index) => ({ index, cands: allCandidates({ echo, validLabels, info, options, flatOptions, base }) }))
  const solve = (keep) =>
    searchPlans(
      all.map((e) => ({ index: e.index, cands: pruneDominated(e.cands.filter((c) => keep(c, info))) })).filter((e) => e.cands.length > 0),
      needed,
    )
  // 방법별 비교: 민맥싱만 / 깡만 / 섞어서. 섞어서의 두 계획(빠른·안정적인)을 아래 카드로 보여 줍니다.
  const strategies = Object.fromEntries(
    Object.entries(STRATEGIES)
      .filter(([key]) => key !== 'flat' || (info.flatLabel && base > 0))
      .map(([key, keep]) => [key, solve(keep)]),
  )
  const { fast, safe } = strategies.mixed
  return { achieved: false, neededPercentTotal: needed, fast, safe, strategies, impossible: !fast }
}
