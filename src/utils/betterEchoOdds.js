// 새 에코(+25, 서브 옵션 5개)를 하나 띄웠을 때, 그 캐릭터 기준 유효 옵션 점수가 지금 에코보다
// 높게 나올 확률을 계산합니다. 서브 옵션 13종 중 5개가 겹치지 않게 같은 확률로 붙고,
// 옵션마다 단계는 subStatProbabilities 표의 확률로 뜬다고 봅니다(목표 스탯 계산기와 같은 가정).
// 경우의 수가 많아서 정확히 세지 않고 여러 번 굴려 본(시뮬레이션) 비율을 씁니다.
import { SUB_STAT_NAMES, SUB_STAT_OPTIONS, formatSubStatValue } from '../config/subStatOptions'
import { SUB_STAT_PROBABILITIES } from '../config/subStatProbabilities'
import { scoreValidStats } from './echoScore'

const SLOTS = 5
const SAMPLES = 20000

function pickTier(label) {
  const probs = SUB_STAT_PROBABILITIES[label] ?? []
  const whole = probs.reduce((s, p) => s + p, 0)
  let r = Math.random() * whole
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i]
    if (r <= 0) return i
  }
  return probs.length - 1
}

/**
 * 캐릭터 유효 옵션 기준으로 새 에코 점수 분포를 한 번 만들어 둡니다(점수 오름차순 배열).
 * 이 배열로 "점수 X보다 높을 확률"을 여러 자리에서 바로 구합니다.
 */
export function sampleEchoScores(validLabels, samples = SAMPLES) {
  const scores = new Float64Array(samples)
  const pool = [...SUB_STAT_NAMES]
  for (let n = 0; n < samples; n++) {
    // 13종 중 5개를 겹치지 않게 고릅니다(앞 5칸만 섞기).
    for (let i = 0; i < SLOTS; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const subs = []
    for (let i = 0; i < SLOTS; i++) {
      const label = pool[i]
      if (!validLabels.includes(label)) continue // 유효하지 않은 옵션은 점수에 안 들어가서 계산 생략
      const value = SUB_STAT_OPTIONS[label][pickTier(label)]
      subs.push({ label, valueText: formatSubStatValue(label, value) })
    }
    scores[n] = scoreValidStats(subs, validLabels).total
  }
  return scores.sort()
}

/** 분포에서 점수가 threshold보다 높게(1점 이상 차이 아니라, 조금이라도 더 높게) 나올 확률(0~1). */
export function probabilityAbove(sortedScores, threshold) {
  // 이진 탐색: threshold보다 큰 첫 위치
  let lo = 0
  let hi = sortedScores.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sortedScores[mid] <= threshold + 1e-9) lo = mid + 1
    else hi = mid
  }
  return (sortedScores.length - lo) / sortedScores.length
}
