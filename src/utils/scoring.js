import { SUB_STAT_OPTIONS } from '../config/subStatOptions'

// 공격력/방어력(플랫)은 단계마다 1점, 그 외 모든 유효 옵션은 단계마다 1.5점입니다.
const ONE_POINT_STATS = ['공격력', '방어력']
const TIER_GRADES = ['F', 'E', 'D', 'C', 'B', 'A', 'L']

// 에코 하나가 이론상 받을 수 있는 최고점(유효 옵션 5개가 전부 1.5점짜리 스탯이고 전부 8단계일 때).
// 시스템상 가능한 수치지만, 실제로 이 조합이 나올 확률은 거의 없는 "만점 기준선"입니다.
export const MAX_SCORE_PER_ECHO = 60

/** 해당 스탯 값이 SUB_STAT_OPTIONS 중 몇 번째 단계인지(1부터 시작) 반환합니다. 못 찾으면 0. */
export function tierOf(label, valueText) {
  const options = SUB_STAT_OPTIONS[label]
  if (!options) return 0
  const num = parseFloat(valueText)
  const idx = options.findIndex((v) => v === num)
  return idx === -1 ? 0 : idx + 1
}

export function pointsPerTier(label) {
  return ONE_POINT_STATS.includes(label) ? 1 : 1.5
}

/** 단계(1~) 를 F/E/D/C/B/A/L 등급 문자로 변환합니다. 8단계는 최고 등급(L)으로 처리합니다. */
export function gradeOfTier(tier) {
  if (tier <= 0) return '-'
  return TIER_GRADES[Math.min(tier - 1, TIER_GRADES.length - 1)]
}

/**
 * 캡처된 모든 서브 스탯을 화면 표시용으로 정리합니다. 유효 옵션(validLabels)에 해당하면
 * valid: true 로 표시되고 점수에 반영되며, 아닌 것은 valid: false 로 표시만 되고 점수에는
 * 반영되지 않습니다.
 */
export function buildDisplayBreakdown(subStats, validLabels) {
  return subStats
    .filter((s) => s.label && s.valueText)
    .map((s) => {
      const tier = tierOf(s.label, s.valueText)
      const valid = validLabels.includes(s.label)
      const points = valid ? tier * pointsPerTier(s.label) : 0
      return {
        label: s.label,
        valueText: s.valueText,
        tier,
        grade: gradeOfTier(tier),
        valid,
        points,
      }
    })
}

/** 점수(0~60)를 F/E/D/C/B/A/L 티어로 변환합니다. 10점 단위 구간, 60점만 L입니다. */
export function scoreToTier(score) {
  if (score >= 60) return 'L'
  if (score >= 50) return 'A'
  if (score >= 40) return 'B'
  if (score >= 30) return 'C'
  if (score >= 20) return 'D'
  if (score >= 10) return 'E'
  return 'F'
}

// 티어별 표시 색상: F/E/D=브론즈, C/B=실버, A=골드, L=차분한 어두운 빨강
const TIER_COLORS = {
  F: '#a9754a',
  E: '#a9754a',
  D: '#a9754a',
  C: '#b9c2cc',
  B: '#b9c2cc',
  A: '#e8c547',
  L: '#a13f3f',
}

export function tierColor(tier) {
  return TIER_COLORS[tier] ?? 'var(--text-primary)'
}

/** validLabels에 해당하는(유효한) 서브스탯의 점수만 합산합니다. */
export function computeEchoScore(subStats, validLabels) {
  const breakdown = buildDisplayBreakdown(subStats, validLabels)
  const score = breakdown.reduce((sum, b) => sum + b.points, 0)
  return { score, breakdown }
}
