const ELEMENT_BONUS = ['응결', '용융', '전도', '기류', '회절', '인멸'].map((name) => [`${name} 피해 보너스`, '30%'])

// 5성 에코 +25 기준 메인 스탯 수치입니다. 첫 줄은 코스트별로 고를 수 있는 옵션, 둘째 줄은 코스트로 고정입니다.
export const MAIN_STAT_VALUES = {
  4: Object.fromEntries([
    ['크리티컬', '22%'],
    ['크리티컬 피해', '44%'],
    ['공격력', '33%'],
    ['HP', '33%'],
    ['방어력', '41.8%'],
    ['치료 효과 보너스', '26.4%'],
  ]),
  3: Object.fromEntries([
    ['공격력', '30%'],
    ['HP', '30%'],
    ['방어력', '38%'],
    ['공명 효율', '32%'],
    ...ELEMENT_BONUS,
  ]),
  1: Object.fromEntries([
    ['공격력', '18%'],
    ['HP', '22.8%'],
    ['방어력', '18%'],
  ]),
}

const FIXED_MAIN_STAT = {
  4: { label: '공격력', valueText: '150' },
  3: { label: '공격력', valueText: '100' },
  1: { label: 'HP', valueText: '2280' },
}

/**
 * 코스트에 맞춰 메인 스탯 2줄을 다시 만듭니다. 고른 옵션이 그 코스트에 없으면 첫 줄을 비워 다시 고르게 합니다.
 * 코스트를 모르면(또는 잘못 읽었으면) 받은 그대로 돌려줍니다.
 */
export function applyCostToMainStats(mainStats, cost, label) {
  const values = MAIN_STAT_VALUES[cost]
  if (!values) return mainStats
  const current = label ?? mainStats.find((s) => s.valueText?.includes('%') && values[s.label])?.label ?? ''
  const valueText = values[current] ?? ''
  return [
    { id: mainStats[0]?.id ?? 'main-0', label: valueText ? current : '', valueText },
    { id: mainStats[1]?.id ?? 'main-1', ...FIXED_MAIN_STAT[cost] },
  ]
}
