import { describe, expect, it, vi } from 'vitest'

// 캐릭터 목록은 서버에서 받아오는 데이터라, 추천은 가짜로 바꿔 끼웁니다.
vi.mock('./echoRecommend', () => ({
  recommend: (subStats) => [
    { character: { id: 'fake', name: '가짜' }, total: subStats.length * 10, validCount: subStats.length },
  ],
}))

const { echoKey, toBagItem, evaluateBagItem, sortByScore, filterAndSort } = await import('./echoBag')

const st = (label, valueText) => ({ label, valueText })
const recognized = {
  setId: 'molten-rift',
  main: { label: '크리티컬', valueText: '22%' },
  subStats: [st('크리티컬%', '8.1%'), st('공격력%', '10.1%')],
}

describe('echoKey', () => {
  it('세트·메인·서브가 같으면 같은 키', () => {
    expect(echoKey(recognized)).toBe(echoKey({ ...recognized, subStats: [...recognized.subStats] }))
  })

  it('서브 수치 하나만 달라도 다른 키', () => {
    const other = { ...recognized, subStats: [st('크리티컬%', '8.7%'), st('공격력%', '10.1%')] }
    expect(echoKey(other)).not.toBe(echoKey(recognized))
  })

  it('세트가 다르면 다른 키', () => {
    expect(echoKey({ ...recognized, setId: 'other' })).not.toBe(echoKey(recognized))
  })
})

describe('toBagItem', () => {
  it('서브 옵션이 없으면 에코 화면이 아니라서 null', () => {
    expect(toBagItem({ subStats: [] })).toBeNull()
    expect(toBagItem(null)).toBeNull()
  })

  it('필요한 값만 남기고 키를 붙인다', () => {
    const item = toBagItem({ ...recognized, views: ['큰 디버그 이미지'] }, 123)
    expect(item).toMatchObject({ key: echoKey(recognized), setId: 'molten-rift', capturedAt: 123 })
    expect(item.views).toBeUndefined()
  })
})

describe('evaluateBagItem / sortByScore', () => {
  it('가장 잘 맞는 캐릭터와 점수를 붙이고, 점수 높은 순으로 정렬한다', () => {
    const low = evaluateBagItem(toBagItem({ ...recognized, subStats: [st('HP', '430')] }))
    const high = evaluateBagItem(toBagItem(recognized))
    expect(high.bestCharacter.id).toBe('fake')
    expect(high.score).toBe(20)
    expect(sortByScore([low, high]).map((i) => i.score)).toEqual([20, 10])
  })
})

describe('filterAndSort', () => {
  const a = { key: 'a', score: 10, subStats: [st('크리티컬%', '6.3%'), st('공격력%', '10.1%')] }
  const b = { key: 'b', score: 30, subStats: [st('크리티컬%', '9.9%')] }
  const c = { key: 'c', score: 20, subStats: [st('공격력%', '11.6%')] }

  it('고른 옵션을 모두 가진 에코만 남긴다', () => {
    expect(filterAndSort([a, b, c], { required: ['크리티컬%', '공격력%'] }).map((i) => i.key)).toEqual(['a'])
  })

  it('옵션 수치 순으로 정렬하고, 그 옵션이 없는 에코는 뒤로 보낸다', () => {
    expect(filterAndSort([a, b, c], { sortKey: '크리티컬%' }).map((i) => i.key)).toEqual(['b', 'a', 'c'])
  })

  it('점수 순', () => {
    expect(filterAndSort([a, b, c], { sortKey: 'score' }).map((i) => i.key)).toEqual(['b', 'c', 'a'])
  })

  it('기본은 최근 등록 순', () => {
    const items = [{ ...a, capturedAt: 1 }, { ...b, capturedAt: 3 }, { ...c, capturedAt: 2 }]
    expect(filterAndSort(items).map((i) => i.key)).toEqual(['b', 'c', 'a'])
  })
})
