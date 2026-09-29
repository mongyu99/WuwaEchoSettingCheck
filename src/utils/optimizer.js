import { SUB_STAT_OPTIONS } from '../config/subStatOptions'
import { echoSuccessProbability, expectedAttempts } from './probability'

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
