import { describe, expect, it } from 'vitest'
import { costOfMain } from './echoRecognition'

describe('강화 중 메인 옵션으로 코스트 추정', () => {
  it('+25 수치면 표 그대로', () => {
    expect(costOfMain({ label: '공명 효율', valueText: '32%' })).toBe('3')
  })
  it('한 코스트에만 있는 옵션이면 강화 중이어도 그 코스트', () => {
    expect(costOfMain({ label: '공명 효율', valueText: '11.5%' })).toBe('3')
    expect(costOfMain({ label: '크리티컬 피해', valueText: '15.8%' })).toBe('4')
  })
  it('둘째 줄이 HP면 1코', () => {
    expect(costOfMain({ label: 'HP', valueText: '19.1%', second: { label: 'HP', valueText: '1915' } })).toBe('1')
  })
  it('둘째 줄이 공격력이면 비율로 4코/3코를 가른다', () => {
    // 4코 HP 33% / 공격력 150 의 절반 정도 강화
    expect(costOfMain({ label: 'HP', valueText: '16.5%', second: { label: '공격력', valueText: '75' } })).toBe('4')
    // 3코 HP 30% / 공격력 100 의 절반
    expect(costOfMain({ label: 'HP', valueText: '15%', second: { label: '공격력', valueText: '50' } })).toBe('3')
  })
})

describe('강화 화면 메인 줄', () => {
  it('"공명 요율 21.7% ▶ 26.8%"처럼 앞 수치가 섞여도 이름을 바로잡는다', async () => {
    const { readMainStat } = await import('./echoRecognition')
    const m = readMainStat('공명 요율 21.7% Fr 26.8%\n공격력 84')
    expect(m.label).toBe('공명 효율')
    expect(m.valueText).toBe('26.8%')
  })
})
