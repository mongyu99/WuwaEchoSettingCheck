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

// 계산기가 항상 지켜야 하는 규칙들. 1만 가지 무작위 세팅으로 확인한 규칙 중, 고친 뒤 위반이 0이 된 것은 그대로(0건),
// 근사 계산이라 작은 오차가 남는 것(목표를 내리고 올릴 때)은 "크게 튀지 않는다"(1.15배 이내)로 고정합니다.
// (수정 전: 섞어서가 민맥싱만보다 최대 3배, 안정 계획이 빠른 계획보다 최대 5배 나쁘게 나오는 경우가 있었음)
describe('계산기 규칙 (무작위 세팅)', () => {
  let seed = 20261127
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  const pick = (a) => a[Math.floor(rnd() * a.length)]
  const TIERS = {
    '크리티컬%': [6.3, 7.5, 8.7, 10.5], '크리티컬 피해%': [12.6, 15, 17.4, 21], '공격력%': [6.4, 7.9, 9.4, 11.6],
    '공명 효율%': [6.8, 8.4, 10, 12.4], 'HP%': [6.4, 8.6, 11.6], '방어력%': [8.1, 10.9, 14.7], '공격력': [30, 40, 50, 60], 'HP': [320, 470, 580],
  }
  const valid = ['크리티컬%', '크리티컬 피해%', '공격력%', '공명 효율%', '공격력']
  const GOALS = [
    () => goal('크리티컬', '크리티컬%', 2 + Math.floor(rnd() * 16)),
    () => goal('크리티컬 피해', '크리티컬 피해%', 5 + Math.floor(rnd() * 35)),
    () => goal('공명 효율', '공명 효율%', 3 + Math.floor(rnd() * 12)),
    () => goal('공격력', '공격력%', 3 + Math.floor(rnd() * 20), '공격력', 800 + Math.floor(rnd() * 500)),
  ]
  const randomEcho = () =>
    echo([...Object.keys(TIERS)].sort(() => rnd() - 0.5).slice(0, 5).map((l) => [l, `${pick(TIERS[l])}${l.endsWith('%') ? '%' : ''}`]))
  const cases = Array.from({ length: 12 }, () => {
    const makers = [...GOALS].sort(() => rnd() - 0.5)
    const n = 1 + Math.floor(rnd() * 3)
    return { goals: makers.slice(0, n).map((m) => m()), extra: makers[n](), echoes: Array.from({ length: 5 }, randomEcho), gi: Math.floor(rnd() * n), delta: 1 + Math.floor(rnd() * 3) }
  })
  const run = (goals, echoes) => planJoint({ goals, echoes, validLabels: valid })
  const withNeed = (goals, i, need) => goals.map((g, j) => (j === i ? { ...g, need } : g))
  const results = cases.map((c) => ({ ...c, r: run(c.goals, c.echoes) }))

  it('보여 주는 계획은 모든 목표를 채우고, 같은 에코를 두 번 쓰지 않고, 시도 합계가 맞다', () => {
    for (const { goals, r } of results) {
      for (const p of [r.fast, r.safe].filter(Boolean)) {
        goals.forEach((g, i) => expect(p.steps.reduce((s, st) => s + st.gains[i], 0)).toBeGreaterThanOrEqual(g.need - 1e-6))
        const used = p.steps.map((st) => st.echoIndex)
        expect(new Set(used).size).toBe(used.length)
        expect(p.attempts).toBeCloseTo(p.steps.reduce((s, st) => s + st.attempts, 0))
      }
    }
  })

  it('빠른 계획은 안정 계획보다 시도가 많지 않고, 안정 계획은 빠른 계획보다 덜 안정적이지 않다', () => {
    for (const { r } of results) {
      if (!r.fast || !r.safe) continue
      expect(r.fast.attempts).toBeLessThanOrEqual(r.safe.attempts + 1e-9)
      expect(r.safe.minProbability).toBeGreaterThanOrEqual(r.fast.minProbability - 1e-12)
    }
  })

  it('"섞어서"는 "민맥싱만"·"깡만"보다 어렵지 않다', () => {
    for (const { r } of results) {
      for (const k of ['minmax', 'flat']) {
        if (!r.strategies[k]?.fast) continue
        expect(r.strategies.mixed.fast).not.toBeNull()
        expect(r.strategies.mixed.fast.attempts).toBeLessThanOrEqual(r.strategies[k].fast.attempts + 1e-9)
      }
    }
  })

  it('목표를 내리면 계속 가능하고, 시도가 크게 늘지 않는다 (올릴 때는 크게 줄지 않는다)', () => {
    for (const { goals, echoes, gi, delta, r } of results) {
      if (!r.fast) continue
      const lower = run(withNeed(goals, gi, Math.max(0.5, goals[gi].need - delta)), echoes)
      expect(lower.fast).not.toBeNull()
      expect(lower.fast.attempts).toBeLessThanOrEqual(r.fast.attempts * 1.15)
      expect(lower.safe.minProbability * 1.15).toBeGreaterThanOrEqual(r.safe.minProbability)
      const higher = run(withNeed(goals, gi, goals[gi].need + delta), echoes)
      if (higher.fast) expect(higher.fast.attempts * 1.15).toBeGreaterThanOrEqual(r.fast.attempts)
    }
  })

  it('목표를 하나 더 걸면 시도가 줄지 않는다', () => {
    for (const { goals, extra, echoes, r } of results) {
      if (!r.fast) continue
      const more = run([...goals, extra], echoes)
      if (more.fast) expect(more.fast.attempts * 1.02).toBeGreaterThanOrEqual(r.fast.attempts)
    }
  })

  it('실제 사례: 1차 수정 코드에서 "섞어서"가 "민맥싱만"보다 1.2배 어렵게 나오던 세팅', () => {
    // 1차 수정(84616ad)에서 섞어서 약 156만, 민맥싱만 약 130만으로 나오던 세팅. 무작위 12개로는 안 걸려서 고정해 둡니다.
    const e = (...pairs) => echo(pairs)
    const echoes = [
      e(['공격력', '60'], ['공명 효율%', '10%'], ['HP', '320'], ['크리티컬 피해%', '17.4%'], ['크리티컬%', '8.7%']),
      e(['HP%', '8.6%'], ['공명 효율%', '10%'], ['공격력%', '6.4%'], ['크리티컬 피해%', '17.4%'], ['방어력%', '10.9%']),
      e(['공명 효율%', '6.8%'], ['방어력%', '14.7%'], ['공격력%', '7.9%'], ['HP', '580'], ['크리티컬 피해%', '21%']),
      e(['공격력', '50'], ['방어력%', '10.9%'], ['크리티컬%', '10.5%'], ['크리티컬 피해%', '12.6%'], ['공격력%', '7.9%']),
      e(['크리티컬%', '10.5%'], ['공명 효율%', '6.8%'], ['크리티컬 피해%', '15%'], ['공격력', '60'], ['HP%', '8.6%']),
    ]
    const goals = [goal('공격력', '공격력%', 7, '공격력', 1042), goal('크리티컬', '크리티컬%', 4), goal('크리티컬 피해', '크리티컬 피해%', 14)]
    const r = run(goals, echoes)
    expect(r.strategies.mixed.fast.attempts).toBeLessThanOrEqual(r.strategies.minmax.fast.attempts + 1e-9)
  })

  it('같은 입력이면 같은 결과', () => {
    const { goals, echoes, r } = results[0]
    expect(run(goals, echoes).fast?.attempts ?? null).toBe(r.fast?.attempts ?? null)
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
