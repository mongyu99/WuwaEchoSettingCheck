import { describe, expect, it } from 'vitest'
import { runOptimizerFromGap } from './optimizer'

// 추천 계산기가 확률을 맞게 붙이고, 확률이 더 높은 방법을 고르는지 확인합니다.
// 기대값은 손으로 계산: C(13-k, 5-k) / C(13,5) × (필요 단계 이상 확률)

const VALID = ['크리티컬%', '크리티컬 피해%', '공격력%', '공명 해방 피해 보너스%', '공격력']
const st = (label, valueText) => ({ label, valueText })
const TOTAL = 1287 // C(13,5)
const pct = (combos, tierPercent) => (combos / TOTAL) * tierPercent

describe('runOptimizerFromGap 확률', () => {
  it('3유효 에코: 공% 다시 띄우기(0.306%)가 플랫 채우기(0.285%)보다 높아서 추천', () => {
    const echo = {
      subStats: [st('크리티컬%', '8.1%'), st('크리티컬 피해%', '16.2%'), st('공격력%', '6.4%'), st('HP', '430'), st('방어력%', '9%')],
    }
    const r = runOptimizerFromGap({ category: '공격력', gapValue: 45, base: 1000, echoes: [echo], validLabels: VALID })
    const [step] = r.steps

    // 크확·크피 유지 + 공% 10.9 이상: C(10,2)=45가지 × (5.8252 + 2.9126)%
    expect(step.action).toBe('upgrade')
    expect(step.toValue).toBe('10.9%')
    expect(step.probability).toBeCloseTo(pct(45, 8.7378), 4)
    expect(step.attempts).toBeCloseTo(100 / step.probability, 6)

    // 크확·크피·공% 유지 + 플랫 50 이상: C(9,1)=9가지 × (37.8641 + 2.9126)%
    expect(step.alt.action).toBe('replace')
    expect(step.alt.label).toBe('공격력')
    expect(step.alt.probability).toBeCloseTo(pct(9, 40.7767), 4)
    expect(step.probability).toBeGreaterThan(step.alt.probability)
  })

  it('수치가 빈 옵션(크리 빈값)은 유지 조건에서 빠짐: 플랫 채우기(1.43%)를 추천', () => {
    const echo = {
      subStats: [st('크리티컬%', ''), st('크리티컬 피해%', '15%'), st('공격력%', '7.1%'), st('HP%', '7.9%'), st('방어력', '50')],
    }
    const r = runOptimizerFromGap({ category: '공격력', gapValue: 45, base: 1000, echoes: [echo], validLabels: VALID })
    const [step] = r.steps

    // 크피·공% 유지 + 플랫 50 이상: C(10,2)=45 × 40.7767%
    expect(step.action).toBe('add')
    expect(step.label).toBe('공격력')
    expect(step.probability).toBeCloseTo(pct(45, 40.7767), 4)

    // 크피 유지 + 공% 11.6(최고 단계): C(11,3)=165 × 2.9126%
    expect(step.alt.action).toBe('upgrade')
    expect(step.alt.probability).toBeCloseTo(pct(165, 2.9126), 4)
  })

  it('확률이 0인 방법은 추천 후보에서 빠짐 (플랫 공격력 70은 확률표상 0%)', () => {
    const echo = { subStats: [st('크리티컬%', '8.1%'), st('HP', '430')] }
    // 기초 공격력 1000에서 6.5% 부족 = 플랫 65 필요 → 플랫은 70만 충분한데 확률 0
    const r = runOptimizerFromGap({ category: '공격력', gapValue: 65, base: 1000, echoes: [echo], validLabels: VALID })

    const all = r.steps.flatMap((s) => [s, s.alt].filter(Boolean))
    expect(all.every((s) => s.probability > 0)).toBe(true)
    expect(r.steps[0].label).toBe('공격력%')
  })

  it('목표를 이미 채웠으면 추천 없음', () => {
    const r = runOptimizerFromGap({ category: '공격력', gapValue: 0, base: 1000, echoes: [], validLabels: VALID })
    expect(r).toEqual({ achieved: true, steps: [] })
  })
})
