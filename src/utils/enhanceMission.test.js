import { describe, expect, it } from 'vitest'
import { checkGoal } from './enhanceMission'

const goal = { echoIndex: 1, cost: 3, keep: ['크리티컬%'], targets: [{ label: '공격력%', min: 9.4 }] }
const subs = (pairs) => pairs.map(([label, valueText]) => ({ label, valueText }))

describe('강화 목표 확인', () => {
  it('옵션이 덜 열렸으면 대기', () => {
    expect(checkGoal(goal, { cost: 3, subStats: subs([['크리티컬%', '6.3%']]) }).status).toBe('wait')
  })
  it('다 채우면 달성', () => {
    expect(checkGoal(goal, { cost: 3, subStats: subs([['크리티컬%', '6.3%'], ['공격력%', '10.1%']]) }).status).toBe('ok')
  })
  it('수치가 모자라거나 5칸 다 열렸는데 없으면 실패', () => {
    expect(checkGoal(goal, { cost: 3, subStats: subs([['공격력%', '7.1%']]) }).status).toBe('fail')
    const five = subs([['HP', '320'], ['방어력', '40'], ['HP%', '6.4%'], ['방어력%', '8.1%'], ['공격력%', '11.6%']])
    expect(checkGoal(goal, { cost: 3, subStats: five }).status).toBe('fail')
  })
  it('코스트가 다르면 실패', () => {
    expect(checkGoal(goal, { cost: 4, subStats: subs([['크리티컬%', '6.3%']]) }).status).toBe('fail')
  })
})

describe('지킬 옵션은 지금 수치 이상', () => {
  const g = { echoIndex: 0, cost: 3, keep: [{ label: '크리티컬%', min: 8.1 }], targets: [{ label: '공격력%', min: 9.4 }] }
  it('지킬 옵션이 지금보다 낮게 붙으면 실패', () => {
    expect(checkGoal(g, { cost: 3, subStats: subs([['크리티컬%', '6.3%'], ['공격력%', '10.1%']]) }).status).toBe('fail')
  })
  it('같거나 높으면 달성', () => {
    expect(checkGoal(g, { cost: 3, subStats: subs([['크리티컬%', '8.1%'], ['공격력%', '10.1%']]) }).status).toBe('ok')
  })
})
