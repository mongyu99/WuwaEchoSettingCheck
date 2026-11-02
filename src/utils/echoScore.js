import { SUB_STAT_OPTIONS } from '../config/subStatOptions'

// 유효 옵션 하나의 만점입니다. 에코 하나는 100점, 에코 5개 합계는 500점이 만점입니다.
export const POINTS_PER_OPTION = 20

// 플랫 옵션은 같은 스탯의 % 옵션보다 효율이 낮은 2순위라, 점수를 절반만 줍니다.
export const FLAT_POINT_RATE = 0.5
const FLAT_LABELS = new Set(['공격력', '방어력', 'HP'])

// 등급 기준(에코 5개 합계 500점 만점). 엔드게임 점수 구간(0·12k·16k·21k·29k·37k·45k·58k)을 최고 구간 대비 비율로 옮긴 값입니다.
export const GRADES = [
  { min: 500, label: '무지개 왕관', icon: 'crown-rainbow' },
  { min: 390, label: '왕관', icon: 'crown' },
  { min: 320, label: 'SSS', icon: 'sss' },
  { min: 250, label: 'SS', icon: 'ss' },
  { min: 180, label: 'S', icon: 's' },
  { min: 140, label: 'A', icon: 'a' },
  { min: 105, label: 'B', icon: 'b' },
  { min: 0, label: '등급 없음', icon: 'none' },
]

// 소수 합산 오차로 100점이 99.999…가 되어 등급이 내려가지 않게 작은 여유를 둡니다.
export const gradeOf = (total) => GRADES.find((g) => total + 0.001 >= g.min)

/** 유효 옵션인 서브 스탯마다 티어표에서 몇 번째 단계인지 찾아 점수를 냅니다. 티어표에 없는 수치는 0점입니다. */
export function scoreValidStats(subStats, validLabels) {
  const rows = subStats
    .filter((s) => s.label && s.valueText && validLabels.includes(s.label))
    .map((s) => {
      const tiers = SUB_STAT_OPTIONS[s.label] ?? []
      const tier = tiers.indexOf(parseFloat(s.valueText)) + 1
      const rate = FLAT_LABELS.has(s.label) ? FLAT_POINT_RATE : 1
      const points = tiers.length ? (tier / tiers.length) * POINTS_PER_OPTION * rate : 0
      return { id: s.id, label: s.label, valueText: s.valueText, tier, tierCount: tiers.length, points }
    })
  return { rows, total: rows.reduce((sum, row) => sum + row.points, 0) }
}

/** 에코 전체의 유효 점수 합계입니다. */
export function scoreEchoes(echoes, validLabels) {
  return echoes.reduce((sum, echo) => sum + scoreValidStats(echo.subStats, validLabels).total, 0)
}
