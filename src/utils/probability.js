import { SUB_STAT_OPTIONS } from '../config/subStatOptions'
import { SUB_STAT_PROBABILITIES } from '../config/subStatProbabilities'

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
