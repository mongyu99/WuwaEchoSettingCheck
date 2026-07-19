import { SUB_STAT_OPTIONS } from '../config/subStatOptions'

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

/**
 * 에코를 "먼저 건드릴 순서"로 정렬합니다: 유효 옵션이 가장 적게 채워진 에코 먼저, 같으면 서브스탯
 * 값 합계가 가장 낮은 에코 먼저.
 */
function priorityOrder(echoes, validLabels) {
  return echoes
    .map((echo, index) => {
      const validCount = echo.subStats.filter((s) => s.label && validLabels.includes(s.label)).length
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
 * 목표까지 남은 값(gapValue, 이미 "합산 스탯"의 현재 총합 기준으로 계산된 부족분)을 채우려면
 * 어떤 에코의 어떤 자리를 바꿔야 하는지 계산합니다.
 * 1순위: 유효 옵션을 희생하지 않는 자리부터 채웁니다 — 빈 자리가 있으면 거기에 추가하고, 자리가
 * 꽉 찼으면 "유효 옵션이 아닌" 스탯을 찾아 그 자리를 필요한 스탯으로 교체합니다(어차피 점수에
 * 반영 안 되던 자리라 손해가 없음). 2순위: 그래도 부족하면 이미 있는 같은 스탯을 최고 단계로
 * 올리는 민맥싱입니다. 각 단계는 "그 시점에 남은 필요량을 채우는 가장 낮은 단계"를 고릅니다 —
 * 남은 필요량보다 큰 단계만 있으면 그중 최소(=사실상 최고 단계)를 씁니다. 정확한 조합 최적화는
 * 아니고 근사치입니다.
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
  const maxTierValue = options.length ? options[options.length - 1] : null
  if (!maxTierValue) return { achieved: false, steps: [], impossible: true, neededPercentTotal }

  // 기준값 곱셈형 카테고리는, 유효 옵션이 아닌 자리를 %가 아니라 "플랫" 스탯으로 채우는 대안도 있다고 안내합니다.
  const flatOptions = info.flatLabel ? SUB_STAT_OPTIONS[info.flatLabel] ?? [] : []
  const flatMax = flatOptions.length ? flatOptions[flatOptions.length - 1] : null
  const altFlat = flatMax ? { label: info.flatLabel, value: `${flatMax}` } : null

  const ordered = priorityOrder(echoes, validLabels)
  const steps = []
  let remainingPercent = neededPercentTotal

  // 1순위: 빈 자리 채우기 → 없으면 유효 옵션이 아닌 스탯을 교체 (둘 다 기존 유효 옵션은 안 건드림)
  for (const { echo, index } of ordered) {
    if (remainingPercent <= 0) break
    if (echo.subStats.some((s) => s.label === info.percentLabel)) continue // 이미 이 스탯을 갖고 있음

    if (echo.subStats.length < 5) {
      const pick = pickSufficientTier(options, remainingPercent)
      steps.push({
        echoIndex: index,
        action: 'add',
        label: info.percentLabel,
        toValue: `${pick}%`,
        gain: pick,
        altFlat,
      })
      remainingPercent -= pick
      continue
    }

    const invalidStat = echo.subStats.find((s) => s.label && !validLabels.includes(s.label))
    if (invalidStat) {
      const pick = pickSufficientTier(options, remainingPercent)
      steps.push({
        echoIndex: index,
        action: 'replace',
        fromLabel: invalidStat.label,
        fromValue: invalidStat.valueText,
        label: info.percentLabel,
        toValue: `${pick}%`,
        gain: pick,
        altFlat,
      })
      remainingPercent -= pick
    }
  }

  // 2순위: 이미 있는 같은 스탯을 필요한 만큼만 올리는 민맥싱
  if (remainingPercent > 0) {
    for (const { echo, index } of ordered) {
      if (remainingPercent <= 0) break
      const existing = echo.subStats.find((s) => s.label === info.percentLabel)
      if (!existing) continue
      const currentValue = parseFloat(existing.valueText)
      if (Number.isNaN(currentValue) || currentValue >= maxTierValue) continue
      const higherOptions = options.filter((v) => v > currentValue)
      const pick = pickSufficientTier(higherOptions, currentValue + remainingPercent)
      steps.push({
        echoIndex: index,
        action: 'upgrade',
        label: info.percentLabel,
        fromValue: existing.valueText,
        toValue: `${pick}%`,
        gain: pick - currentValue,
      })
      remainingPercent -= pick - currentValue
    }
  }

  return {
    achieved: false,
    neededPercentTotal,
    steps,
    impossible: steps.length === 0 || remainingPercent > 0.01,
    remainingPercent: Math.max(0, Math.round(remainingPercent * 100) / 100),
  }
}
