import { describe, expect, it } from 'vitest'
import { hasRankValues, rankGroups, weaponBonusesAt, weaponDescriptionAt } from './weaponRank'

const weapon = {
  description:
    '공격력이 12%/15%/18%/21%/24% 증가된다. 일반 공격 피해를 36%/45%/54%/63%/72% 증가시키고, 4초간 지속된다. ' +
    '전체 피해를 8%/10%/12%/14%/16% 증가시키고, 최대 3스택까지 중첩 가능하며, 30초간 지속된다.',
  bonuses: [
    { category: '공격력', value: 12, rankRef: 1 },
    { category: '크리티컬', value: 8 },
  ],
}

describe('weaponRank', () => {
  it('설명에서 5단계 묶음만 찾는다(4초, 3스택 같은 단일 숫자는 무시)', () => {
    expect(rankGroups(weapon.description)).toEqual([
      ['12%', '15%', '18%', '21%', '24%'],
      ['36%', '45%', '54%', '63%', '72%'],
      ['8%', '10%', '12%', '14%', '16%'],
    ])
  })

  it('고른 돌파 단계 값만 남긴다', () => {
    expect(weaponDescriptionAt(weapon, 3)).toBe(
      '공격력이 18% 증가된다. 일반 공격 피해를 54% 증가시키고, 4초간 지속된다. ' +
        '전체 피해를 12% 증가시키고, 최대 3스택까지 중첩 가능하며, 30초간 지속된다.',
    )
  })

  it('소수와 % 없는 값도 처리하고, 범위를 벗어난 단계는 1~5로 맞춘다', () => {
    const w = { description: '회복 0.5/0.75/1/1.25/1.5 증가' }
    expect(weaponDescriptionAt(w, 2)).toBe('회복 0.75 증가')
    expect(weaponDescriptionAt(w, 9)).toBe('회복 1.5 증가')
  })

  it('rankRef 보너스만 해당 묶음의 돌파 단계 값으로 바꾼다', () => {
    expect(weaponBonusesAt(weapon, 5)).toEqual([
      { category: '공격력', value: 24 },
      { category: '크리티컬', value: 8 },
    ])
  })

  it('묶음이 없는 무기는 돌파 선택이 필요 없다', () => {
    expect(hasRankValues(weapon)).toBe(true)
    expect(hasRankValues({ description: '공격력이 12% 증가된다.' })).toBe(false)
  })
})
