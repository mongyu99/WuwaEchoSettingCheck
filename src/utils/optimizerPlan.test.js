import { describe, expect, it } from 'vitest'
import { planOptimizerFromGap } from './optimizer'

const valid = ['크리티컬%', '크리티컬 피해%', '공격력%']
const echo = (subs) => ({ subStats: subs.map(([label, valueText], i) => ({ id: `s${i}`, label, valueText })) })

describe('목표 스탯 계획(빠른 / 안정적인)', () => {
  const echoes = [
    echo([['크리티컬%', '6.3%'], ['방어력%', '10.9%'], ['HP%', '10.1%'], ['공명 효율%', '6.8%'], ['방어력', '50']]),
    echo([['크리티컬%', '6.3%'], ['방어력%', '9%'], ['HP%', '8.6%'], ['공명 효율%', '6.8%'], ['방어력', '40']]),
    echo([['크리티컬%', '6.3%'], ['방어력%', '8.1%'], ['HP%', '7.1%'], ['공명 효율%', '7.6%'], ['방어력', '60']]),
  ]

  it('부족분을 채우는 계획을 두 가지 만들고, 빠른 계획은 시도 횟수 합이 가장 적다', () => {
    const r = planOptimizerFromGap({ category: '크리티컬', gapValue: 10, base: null, echoes, validLabels: valid })
    expect(r.fast).not.toBeNull()
    expect(r.safe).not.toBeNull()
    const sum = (plan) => plan.steps.reduce((s, st) => s + st.gainPercent, 0)
    expect(sum(r.fast)).toBeGreaterThanOrEqual(10 - 0.01)
    expect(sum(r.safe)).toBeGreaterThanOrEqual(10 - 0.01)
    expect(r.fast.totalAttempts).toBeLessThanOrEqual(r.safe.totalAttempts)
    expect(r.safe.minProbability).toBeGreaterThanOrEqual(r.fast.minProbability)
  })

  it('채울 수 없으면 impossible', () => {
    const r = planOptimizerFromGap({ category: '크리티컬', gapValue: 999, base: null, echoes, validLabels: valid })
    expect(r.impossible).toBe(true)
  })
})

describe('민맥싱 + 깡을 한 에코에서 같이', () => {
  it('공격력%가 이미 있는 에코들로 큰 부족분을 채울 때, 깡만 고르지 않고 같이 노리는 교체도 후보에 든다', () => {
    const atkValid = ['크리티컬%', '크리티컬 피해%', '공격력%', '공격력']
    const echoes = Array.from({ length: 5 }, () =>
      echo([['크리티컬%', '6.3%'], ['공격력%', '7.1%'], ['HP%', '8.6%'], ['방어력%', '9%'], ['공명 효율%', '6.8%']]),
    )
    const r = planOptimizerFromGap({ category: '공격력', gapValue: 200, base: 1000, echoes, validLabels: atkValid })
    expect(r.fast).not.toBeNull()
    expect(r.fast.steps.some((s) => s.action === 'combo')).toBe(true)
  })
})

describe('방법 비교', () => {
  it('민맥싱만 / 깡만 / 섞어서를 각각 계산하고, 못 채우는 방법은 최대 증가량을 알려 준다', () => {
    const atkValid = ['크리티컬%', '크리티컬 피해%', '공격력%', '공격력']
    const echoes = Array.from({ length: 5 }, () =>
      echo([['크리티컬%', '6.3%'], ['공격력%', '10.1%'], ['HP%', '8.6%'], ['방어력%', '9%'], ['공명 효율%', '6.8%']]),
    )
    const r = planOptimizerFromGap({ category: '공격력', gapValue: 200, base: 1000, echoes, validLabels: atkValid })
    expect(r.strategies.minmax.fast).toBeNull() // 10.1 → 11.6 다섯 번이어도 +75
    expect(r.strategies.minmax.maxGain).toBeCloseTo(7.5, 1)
    expect(r.strategies.mixed.fast).not.toBeNull()
  })
})
