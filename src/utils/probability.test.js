import { describe, expect, it } from 'vitest'
import { SUB_STAT_NAMES, SUB_STAT_OPTIONS } from '../config/subStatOptions'
import { SUB_STAT_PROBABILITIES } from '../config/subStatProbabilities'
import { echoSuccessProbability, expectedAttempts, successProbability } from './probability'

// 공개된 단계 확률표(config/subStatProbabilities.js)로 코드가 정확히 계산하는지, 코드와 독립적인
// 두 가지 방법(전수 계산, 시뮬레이션)으로 교차 검증합니다.

/** 시드 고정 난수(mulberry32). 매번 같은 결과가 나와서 테스트가 들쭉날쭉하지 않습니다. */
function seededRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 13종 중 5개를 전부 나열합니다(1287가지). */
function allFiveOfThirteen() {
  const result = []
  const pick = (start, chosen) => {
    if (chosen.length === 5) return result.push(chosen)
    for (let i = start; i < SUB_STAT_NAMES.length; i++) pick(i + 1, [...chosen, SUB_STAT_NAMES[i]])
  }
  pick(0, [])
  return result
}

/** 게임 규칙대로 에코 하나를 굴립니다: 서로 다른 옵션 5개 + 각 옵션의 단계. */
function rollEcho(random) {
  const pool = [...SUB_STAT_NAMES]
  const echo = new Map()
  for (let slot = 0; slot < 5; slot++) {
    const [label] = pool.splice(Math.floor(random() * pool.length), 1)
    const probs = SUB_STAT_PROBABILITIES[label]
    let r = random() * probs.reduce((s, p) => s + p, 0)
    let tier = 0
    while (tier < probs.length - 1 && (r -= probs[tier]) >= 0) tier++
    echo.set(label, SUB_STAT_OPTIONS[label][tier])
  }
  return echo
}

describe('확률표 데이터', () => {
  it.each(SUB_STAT_NAMES)('%s: 단계 수와 확률 수가 같고 합이 100%%', (label) => {
    expect(SUB_STAT_PROBABILITIES[label]).toHaveLength(SUB_STAT_OPTIONS[label].length)
    const sum = SUB_STAT_PROBABILITIES[label].reduce((s, p) => s + p, 0)
    expect(sum).toBeCloseTo(100, 2)
  })

  it('서브옵션은 13종', () => {
    expect(SUB_STAT_NAMES).toHaveLength(13)
  })
})

describe('successProbability: 필요 수치 이상 단계가 나올 확률', () => {
  it('최저 단계 이하를 요구하면 100%', () => {
    expect(successProbability('공격력%', 6.4)).toBeCloseTo(100, 2)
    expect(successProbability('공격력%', 0)).toBeCloseTo(100, 2)
  })

  it('상위 단계 확률만 더함 (공격력% 10.9 이상 = 5.8252 + 2.9126)', () => {
    expect(successProbability('공격력%', 10.9)).toBeCloseTo(8.7378, 4)
    expect(successProbability('공격력%', 10.5)).toBeCloseTo(8.7378, 4)
  })

  it('최고 단계보다 크면 0%', () => {
    expect(successProbability('공격력%', 12)).toBe(0)
  })

  it('확률이 0인 단계만 남으면 0% (플랫 공격력 70)', () => {
    expect(successProbability('공격력', 70)).toBe(0)
  })
})

describe('echoSuccessProbability: 새 에코 1개가 조건을 모두 만족할 확률', () => {
  const combos = allFiveOfThirteen()

  it.each([0, 1, 2, 3, 4])('지켜야 할 옵션 %i종 + 목표 옵션 1종이 다 뜰 확률 = 전수 계산값', (required) => {
    const needed = SUB_STAT_NAMES.slice(0, required + 1)
    const hits = combos.filter((c) => needed.every((n) => c.includes(n))).length
    const exact = (hits / combos.length) * 100

    // 목표 수치를 최저 단계로 두면 단계 확률은 확률표 합(반올림 때문에 99.9998% 등)만 곱해집니다.
    const label = needed[needed.length - 1]
    const lowest = SUB_STAT_OPTIONS[label][0]
    const tierFactor = successProbability(label, lowest) / 100
    expect(echoSuccessProbability(required, label, lowest)).toBeCloseTo(exact * tierFactor, 8)
  })

  it('6종 이상은 5칸에 다 못 들어가서 0%', () => {
    expect(echoSuccessProbability(5, '공격력%', 6.4)).toBe(0)
  })

  it.each([
    { required: ['크리티컬%', '크리티컬 피해%'], label: '공격력%', needed: 10.9 },
    { required: ['크리티컬 피해%', '공격력%'], label: '공격력', needed: 50 },
    { required: ['크리티컬%'], label: '크리티컬 피해%', needed: 19.8 },
    { required: [], label: '공격력%', needed: 11.6 },
  ])('시뮬레이션 40만 회와 일치: $label ≥ $needed (유지 옵션 $required)', ({ required, label, needed }) => {
    const random = seededRandom(20260930)
    const trials = 400_000
    let hits = 0
    for (let i = 0; i < trials; i++) {
      const echo = rollEcho(random)
      if (required.every((r) => echo.has(r)) && (echo.get(label) ?? -1) >= needed) hits++
    }
    const p = echoSuccessProbability(required.length, label, needed) / 100
    const observed = hits / trials
    // 이항분포 표준오차의 5배 이내면 같은 값으로 봅니다(우연히 벗어날 확률 약 0.00006%).
    const tolerance = 5 * Math.sqrt((p * (1 - p)) / trials)
    expect(Math.abs(observed - p)).toBeLessThan(tolerance)
  })
})

describe('expectedAttempts: 성공까지 평균 시도 횟수', () => {
  it('확률의 역수', () => {
    expect(expectedAttempts(1)).toBe(100)
    expect(expectedAttempts(25)).toBe(4)
    expect(expectedAttempts(0)).toBe(Infinity)
  })

  it('시뮬레이션: 성공할 때까지 반복한 횟수의 평균과 일치', () => {
    const random = seededRandom(7)
    const pPercent = 3.5
    const runs = 50_000
    let total = 0
    for (let i = 0; i < runs; i++) {
      let n = 1
      while (random() >= pPercent / 100) n++
      total += n
    }
    const mean = total / runs
    const expected = expectedAttempts(pPercent)
    // 기하분포 표준편차 sqrt(1-p)/p 기준 표준오차의 5배
    const tolerance = (5 * Math.sqrt(1 - pPercent / 100)) / (pPercent / 100) / Math.sqrt(runs)
    expect(Math.abs(mean - expected)).toBeLessThan(tolerance)
  })
})
