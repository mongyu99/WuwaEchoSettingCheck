import { describe, expect, it } from 'vitest'
import { createStatVoter } from './statVote'

const main = { label: 'HP%', valueText: '22.8%' }
const subs = (...pairs) => pairs.map(([label, valueText]) => ({ label, valueText }))
const values = (r) => r.map((s) => s.valueText)

describe('createStatVoter: 실시간 인식 수치 안정화', () => {
  it('가끔 잘못 읽은 값(6.3)이 섞여도 다수결로 6.9를 유지', () => {
    const v = createStatVoter()
    v.stabilize(subs(['크리티컬%', '6.9%']), main)
    v.stabilize(subs(['크리티컬%', '6.9%']), main)
    expect(values(v.stabilize(subs(['크리티컬%', '6.3%']), main))).toEqual(['6.9%'])
  })

  it('같은 값 3번 연속이면 고정되어 이후 오인식에도 안 바뀜', () => {
    const v = createStatVoter()
    for (let i = 0; i < 3; i++) v.stabilize(subs(['크리티컬%', '6.9%']), main)
    for (let i = 0; i < 4; i++) expect(values(v.stabilize(subs(['크리티컬%', '6.3%']), main))).toEqual(['6.9%'])
  })

  it('메인 옵션이 바뀌면 다른 에코로 보고 기록 초기화', () => {
    const v = createStatVoter()
    for (let i = 0; i < 3; i++) v.stabilize(subs(['크리티컬%', '6.9%']), main)
    const r = v.stabilize(subs(['크리티컬%', '6.3%']), { label: '공격력%', valueText: '18%' })
    expect(values(r)).toEqual(['6.3%'])
  })

  it('앞줄 옵션 구성이 바뀌면 기록 초기화', () => {
    const v = createStatVoter()
    for (let i = 0; i < 3; i++) v.stabilize(subs(['크리티컬%', '6.9%'], ['HP', '390']), main)
    const r = v.stabilize(subs(['공격력%', '7.9%'], ['HP', '320']), main)
    expect(values(r)).toEqual(['7.9%', '320'])
  })

  it('강화로 새 줄이 열려도 기존 줄 고정 값은 유지', () => {
    const v = createStatVoter()
    for (let i = 0; i < 3; i++) v.stabilize(subs(['크리티컬%', '6.9%']), main)
    const r = v.stabilize(subs(['크리티컬%', '6.3%'], ['HP', '390']), main)
    expect(values(r)).toEqual(['6.9%', '390'])
  })

  it('메인을 못 읽은 프레임은 같은 에코로 봄', () => {
    const v = createStatVoter()
    for (let i = 0; i < 3; i++) v.stabilize(subs(['크리티컬%', '6.9%']), main)
    expect(values(v.stabilize(subs(['크리티컬%', '6.3%']), null))).toEqual(['6.9%'])
  })

  it('reset 후엔 새로 시작', () => {
    const v = createStatVoter()
    for (let i = 0; i < 3; i++) v.stabilize(subs(['크리티컬%', '6.9%']), main)
    v.reset()
    expect(values(v.stabilize(subs(['크리티컬%', '6.3%']), main))).toEqual(['6.3%'])
  })
})
