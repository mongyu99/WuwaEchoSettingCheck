import { SUB_STAT_OPTIONS } from '../config/subStatOptions'
import { successProbability } from './probability'

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
 * 새로 채울 자리에 %스탯을 넣을지 플랫 스탯을 넣을지, "한 번 굴려서 충분한 단계가 나올 확률"이
 * 더 높은 쪽을 골라 추천합니다. 값이 아니라 "그 자리를 이 스탯으로 정했을 때, 재련 한 번으로
 * 목표를 채울 확률"이 기준입니다. 플랫 옵션이 없는 카테고리(공명 효율·크리티컬 등)이거나, 이미 그
 * 라벨을 갖고 있어 후보에서 빠지면 percentLabel/flatLabel을 null로 넘겨서 비교 없이 나머지 하나만
 * 씁니다.
 */
function chooseStatOption({ percentLabel, options, neededPercent, flatLabel, flatOptions, neededFlat }) {
  const percentChoice = percentLabel
    ? {
        label: percentLabel,
        value: `${pickSufficientTier(options, neededPercent)}%`,
        gain: pickSufficientTier(options, neededPercent),
        isFlat: false,
        probability: successProbability(percentLabel, neededPercent),
      }
    : null

  const flatChoice =
    flatLabel && flatOptions.length && neededFlat != null
      ? {
          label: flatLabel,
          value: `${pickSufficientTier(flatOptions, neededFlat)}`,
          gain: pickSufficientTier(flatOptions, neededFlat),
          isFlat: true,
          probability: successProbability(flatLabel, neededFlat),
        }
      : null

  if (percentChoice && flatChoice) {
    return flatChoice.probability > percentChoice.probability
      ? { primary: flatChoice, alt: percentChoice }
      : { primary: percentChoice, alt: flatChoice }
  }
  return { primary: percentChoice ?? flatChoice, alt: null }
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

  // 기준값 곱셈형 카테고리는, 자리를 %가 아니라 "플랫" 스탯으로 채우는 대안도 있습니다 — 어느 쪽이
  // 재련 한 번으로 목표를 채울 확률이 더 높은지 그때그때 비교해서 고릅니다.
  const flatOptions = info.flatLabel ? SUB_STAT_OPTIONS[info.flatLabel] ?? [] : []

  const ordered = priorityOrder(echoes, validLabels)
  const steps = []
  let remainingPercent = neededPercentTotal

  // remainingPercent(퍼센트 단위)를 "지금까지 남은 필요량과 같은 값"의 플랫 스탯 필요량으로 환산합니다.
  const flatEquivalent = () => (base > 0 ? (remainingPercent / 100) * base : null)

  // 선택된 옵션(퍼센트 또는 플랫)만큼 remainingPercent를 줄입니다. 플랫이 선택됐으면 다시 퍼센트
  // 단위로 환산해서 빼야 이후 반복에서 남은 필요량 계산이 맞습니다.
  const consume = (choice) => {
    remainingPercent -= choice.isFlat && base > 0 ? (choice.gain / base) * 100 : choice.gain
  }

  // 1순위: 빈 자리 채우기 → 없으면 유효 옵션이 아닌 스탯을 교체 (둘 다 기존 유효 옵션은 안 건드림)
  for (const { echo, index } of ordered) {
    if (remainingPercent <= 0) break
    // 이미 값까지 채워진 라벨은 후보에서 뺍니다("스탯 선택"/"수치 선택" 미지정인 자리는 빈 자리로 취급).
    const hasPercent = echo.subStats.some((s) => s.label === info.percentLabel && s.valueText)
    const hasFlat = info.flatLabel && echo.subStats.some((s) => s.label === info.flatLabel && s.valueText)
    if (hasPercent && (hasFlat || !info.flatLabel)) continue

    const filledCount = echo.subStats.filter((s) => s.label && s.valueText).length
    if (filledCount < 5) {
      const { primary, alt } = chooseStatOption({
        percentLabel: hasPercent ? null : info.percentLabel,
        options,
        neededPercent: remainingPercent,
        flatLabel: hasFlat ? null : info.flatLabel,
        flatOptions,
        neededFlat: flatEquivalent(),
      })
      steps.push({
        echoIndex: index,
        action: 'add',
        label: primary.label,
        toValue: primary.value,
        gain: primary.gain,
        gainIsFlat: primary.isFlat,
        probability: primary.probability,
        alt,
      })
      consume(primary)
      continue
    }

    const invalidStat = echo.subStats.find((s) => s.label && s.valueText && !validLabels.includes(s.label))
    if (invalidStat) {
      const { primary, alt } = chooseStatOption({
        percentLabel: hasPercent ? null : info.percentLabel,
        options,
        neededPercent: remainingPercent,
        flatLabel: hasFlat ? null : info.flatLabel,
        flatOptions,
        neededFlat: flatEquivalent(),
      })
      steps.push({
        echoIndex: index,
        action: 'replace',
        fromLabel: invalidStat.label,
        fromValue: invalidStat.valueText,
        label: primary.label,
        toValue: primary.value,
        gain: primary.gain,
        gainIsFlat: primary.isFlat,
        probability: primary.probability,
        alt,
      })
      consume(primary)
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
