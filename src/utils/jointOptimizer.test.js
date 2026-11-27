import { describe, expect, it } from 'vitest'
import { planJoint } from './jointOptimizer'

const echo = (pairs) => ({ subStats: pairs.map(([label, valueText], i) => ({ id: `s${i}`, label, valueText })) })
const valid = ['크리티컬%', '크리티컬 피해%', '공격력%', '공격력']
const goal = (category, percentLabel, need, flatLabel = null, base = null) => ({ category, info: { percentLabel, flatLabel }, need, base })

describe('여러 목표를 한 번에', () => {
  const echoes = Array.from({ length: 5 }, () =>
    echo([['크리티컬%', '6.3%'], ['공격력%', '7.1%'], ['HP%', '8.6%'], ['방어력%', '9%'], ['공명 효율%', '6.8%']]),
  )

  it('두 목표를 동시에 채우는 계획 하나를 만들고, 같은 에코를 두 번 쓰지 않는다', () => {
    const r = planJoint({
      goals: [goal('공격력', '공격력%', 5, '공격력', 1000), goal('크리티컬 피해', '크리티컬 피해%', 20)],
      echoes,
      validLabels: valid,
    })
    expect(r.fast).not.toBeNull()
    const total = (i) => r.fast.steps.reduce((s, st) => s + st.gains[i], 0)
    expect(total(0)).toBeGreaterThanOrEqual(5 - 1e-6)
    expect(total(1)).toBeGreaterThanOrEqual(20 - 1e-6)
    const used = r.fast.steps.map((s) => s.echoIndex)
    expect(new Set(used).size).toBe(used.length)
  })

  it('새 에코는 기존 유효 옵션을 지금 수치 이상으로 지켜야 한다', () => {
    const r = planJoint({ goals: [goal('크리티컬 피해', '크리티컬 피해%', 12)], echoes, validLabels: valid })
    const step = r.fast.steps[0]
    expect(step.keep).toEqual(expect.arrayContaining([{ label: '크리티컬%', value: 6.3 }, { label: '공격력%', value: 7.1 }]))
  })

  it('못 채우면 null', () => {
    const r = planJoint({ goals: [goal('크리티컬', '크리티컬%', 999)], echoes, validLabels: valid })
    expect(r.fast).toBeNull()
  })
})

describe('목표를 낮추면 시도 횟수가 늘지 않는다', () => {
  // 예전엔 대표 단계로 대충 고른 계획 하나만 실제 단계로 낮춰서, 목표를 1 낮추면 시도가 1.8배까지 늘던 경우가 있었습니다.
  let seed = 12345
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  const POOL = ['크리티컬%', '크리티컬 피해%', '공격력%', '공명 효율%', 'HP%', '방어력%']
  const OPTIONS = { '크리티컬%': [6.3, 7.5, 8.7, 10.5], '크리티컬 피해%': [12.6, 15, 17.4, 21], '공격력%': [6.4, 7.9, 9.4, 11.6], '공명 효율%': [6.8, 8.4, 10, 12.4], 'HP%': [6.4, 8.6, 11.6], '방어력%': [8.1, 10.9, 14.7] }
  const randomEcho = () => echo([...POOL].sort(() => rnd() - 0.5).slice(0, 5).map((l) => [l, `${OPTIONS[l][Math.floor(rnd() * OPTIONS[l].length)]}%`]))
  const validAll = ['크리티컬%', '크리티컬 피해%', '공격력%', '공명 효율%']

  it('무작위 세팅 40개에서 크리 목표를 1 낮춰도 평균 시도가 2% 넘게 늘지 않는다', () => {
    for (let t = 0; t < 40; t++) {
      const echoes = Array.from({ length: 5 }, randomEcho)
      const crit = 4 + Math.floor(rnd() * 14)
      const others = [goal('공명 효율', '공명 효율%', 3 + Math.floor(rnd() * 10)), goal('크리티컬 피해', '크리티컬 피해%', 8 + Math.floor(rnd() * 30))]
      const run = (c) => planJoint({ goals: [goal('크리티컬', '크리티컬%', c), ...others], echoes, validLabels: validAll }).fast
      const a = run(crit)
      const b = run(crit - 1)
      if (!a || !b) continue
      expect(b.attempts).toBeLessThanOrEqual(a.attempts * 1.02)
    }
  })
})

describe('가장 낮은 단계로 맞추기', () => {
  const echoes = Array.from({ length: 5 }, () => echo([['공격력%', '7.1%'], ['HP%', '8.6%'], ['방어력%', '9%']]))

  it('목표가 6.3이면 대표 단계(더 높은 값) 대신 6.3을 노린다', () => {
    const r = planJoint({ goals: [goal('크리티컬', '크리티컬%', 6.3)], echoes, validLabels: valid })
    expect(r.fast.steps).toHaveLength(1)
    expect(r.fast.steps[0].targets[0].value).toBe(6.3)
    expect(r.fast.steps[0].changes[0].to).toBe('6.3%')
  })

  it('낮춘 뒤에도 모든 목표를 채운다', () => {
    const r = planJoint({ goals: [goal('크리티컬', '크리티컬%', 14.6), goal('크리티컬 피해', '크리티컬 피해%', 7.2)], echoes, validLabels: valid })
    for (const plan of [r.fast, r.safe]) {
      const total = (i) => plan.steps.reduce((s, st) => s + st.gains[i], 0)
      expect(total(0)).toBeGreaterThanOrEqual(14.6 - 1e-6)
      expect(total(1)).toBeGreaterThanOrEqual(7.2 - 1e-6)
      expect(plan.attempts).toBeCloseTo(plan.steps.reduce((s, st) => s + st.attempts, 0))
    }
  })
})
