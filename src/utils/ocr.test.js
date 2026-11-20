import { describe, expect, it } from 'vitest'
import { buildStatsFromLines, snapSubStatsToCatalog } from './ocr'

const read = (text) =>
  snapSubStatsToCatalog(
    buildStatsFromLines(text.split('\n').map((t) => ({ text: t })))
      .stats.filter((s) => s.valueText),
  ).filter((s) => s.label && s.valueText)

describe('이름이 깨진 서브 옵션 줄', () => {
  it('크리티컬이 깨져 읽혀도 수치로 크리티컬을 찾는다 (가방 실제 OCR 결과)', () => {
    const stats = read(
      '※※ 크리티컬 피해 13.8%\n9 HP 430\nHe A2|EIY 8.1%\nQ 공명 해방 피해 보너스 8.6%\n(@ 공명 효율 7.6%',
    )
    expect(stats.map((s) => s.label)).toEqual(['크리티컬 피해%', 'HP', '크리티컬%', '공명 해방 피해 보너스%', '공명 효율%'])
  })

  it('HP가 숫자(@110)로 읽혀도 HP로 본다 (가방 실제 OCR 결과)', () => {
    const stats = read('(@) 공명 효율 8.4%\n\\ 크리티컬 8.1%\n공격력 10.9%\n※※ 크리티컬 피해 12.6%\n@110 9.4%')
    expect(stats.map((s) => s.label)).toEqual(['공명 효율%', '크리티컬%', '공격력%', '크리티컬 피해%', 'HP%'])
    expect(read('10 430').map((s) => s.label)).toEqual(['HP'])
  })

  it('수치가 한 옵션에만 있으면 그 옵션으로 본다', () => {
    expect(read('-32|E|H 7.5%').map((s) => s.label)).toEqual(['크리티컬%'])
  })

  it('수치가 여러 옵션에 겹치면 추정하지 않는다', () => {
    expect(read('EEE 7.9%')).toEqual([])
  })

  it('고정 수치는 추정하지 않는다', () => {
    expect(read('EEE 40')).toEqual([])
  })
})

describe('수치가 깨진 줄', () => {
  it('이름 뒤에 숫자를 붙여 주면 정상으로 읽힌다 (숫자 전용 재인식 결과를 합친 모양)', () => {
    expect(read('크리티컬 6.3%\n공격력 7.9%\nHP 360').map((s) => s.label)).toEqual(['크리티컬%', '공격력%', 'HP'])
  })
})
