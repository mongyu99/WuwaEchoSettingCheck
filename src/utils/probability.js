import { SUB_STAT_OPTIONS, SUB_STAT_NAMES } from '../config/subStatOptions'
import { SUB_STAT_PROBABILITIES } from '../config/subStatProbabilities'

const SUB_STAT_SLOTS = 5

/**
 * 서브스탯을 새로 굴렸을 때, neededValue 이상인 단계가 한 번에 나올 확률(%)의 합입니다.
 * (예: 8.6% 이상이면 충분하면, 8.6/9.4/10.1/10.9/11.6 단계 확률을 전부 더함)
 */
export function successProbability(label, neededValue) {
  const options = SUB_STAT_OPTIONS[label] ?? []
  const probs = SUB_STAT_PROBABILITIES[label] ?? []
  let total = 0
  options.forEach((v, i) => {
    if (v >= neededValue) total += probs[i] ?? 0
  })
  return total
}

function combinations(n, k) {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1)
  return result
}

/**
 * 새 에코 하나에 지정한 서로 다른 옵션 count종이 전부 뜰 확률(0~1)입니다. 서브스탯 풀(13종)에서
 * 5개를 중복 없이 같은 가중치로 뽑는다고 가정합니다.
 */
function allPresentProbability(count) {
  const pool = SUB_STAT_NAMES.length
  if (count > SUB_STAT_SLOTS) return 0
  return combinations(pool - count, SUB_STAT_SLOTS - count) / combinations(pool, SUB_STAT_SLOTS)
}

/**
 * 새 에코 하나가 "지켜야 할 기존 유효 옵션 requiredCount종 + label이 neededValue 이상"을 모두
 * 만족할 확률(%)입니다. 서브스탯은 이미 붙은 걸 바꿀 수 없어서, 결국 이런 에코를 새로 띄워야 합니다.
 */
export function echoSuccessProbability(requiredCount, label, neededValue) {
  return allPresentProbability(requiredCount + 1) * successProbability(label, neededValue)
}

/** 확률(%)로 성공할 때까지 평균 몇 개의 에코를 띄워야 하는지(기하분포 기댓값)입니다. */
export function expectedAttempts(probabilityPercent) {
  return probabilityPercent > 0 ? 100 / probabilityPercent : Infinity
}
