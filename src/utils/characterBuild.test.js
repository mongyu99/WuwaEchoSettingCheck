import { beforeAll, describe, expect, it } from 'vitest'
import { catalog } from '../config/catalog'
import { buildForCharacter } from './characterBuild'

const hero = { id: 'hero', name: '테스트', element: '기류' }
let n = 0
const echo = (cost, setId, mainLabel, subs, echoId = null) => ({
  key: `e${n++}`,
  cost,
  setId,
  echoId,
  main: { label: mainLabel, valueText: '1' },
  subStats: subs.map(([label, valueText]) => ({ label, valueText })),
})
const good = [['크리티컬%', '10.5%'], ['크리티컬 피해%', '21%']]
const ok = [['크리티컬%', '6.3%']]

beforeAll(() => {
  catalog.validOptions.hero = ['크리티컬%', '크리티컬 피해%', '공격력%', '기류 피해 보너스%']
  catalog.characterEchoSets.hero = { combos: [[{ setId: 'wind', pieceCount: 5 }]] }
  catalog.echoSetMainEchoes.wind = ['boss']
  catalog.mainEchoes.boss = { name: '보스', cost: 4 }
})

describe('캐릭터 추천 조합', () => {
  it('메인 에코를 고정하고 세트를 맞춰 점수가 가장 높은 5개를 고른다', () => {
    const items = [
      echo(4, 'wind', '크리티컬', ok, 'boss'),
      echo(4, 'wind', '크리티컬', good), // 점수는 더 높지만 메인 에코가 아님
      echo(3, 'wind', '기류 피해 보너스', good),
      echo(3, 'wind', '기류 피해 보너스', ok),
      echo(3, 'fire', '기류 피해 보너스', good), // 세트가 달라 빠져야 함(4-3-3-1-1이면 세트 5개를 못 맞춤)
      echo(1, 'wind', '공격력', good),
      echo(1, 'wind', '공격력', ok),
      echo(1, 'wind', '공격력', ok),
    ]
    const build = buildForCharacter(hero, items)
    expect(build.mainMissing).toBe(false)
    expect(build.setsMet).toBe(true)
    expect(build.picks[0].item.echoId).toBe('boss')
    expect(build.picks).toHaveLength(5)
    expect(build.picks.every((p) => p.item.setId === 'wind')).toBe(true)
  })

  it('메인 에코가 가방에 없으면 일반 에코로 채우고 없다고 알려 준다', () => {
    const items = [echo(4, 'wind', '크리티컬', good), echo(3, 'wind', '기류 피해 보너스', good), echo(3, 'wind', '기류 피해 보너스', ok), echo(1, 'wind', '공격력', ok), echo(1, 'wind', '공격력', ok)]
    const build = buildForCharacter(hero, items)
    expect(build.mainMissing).toBe(true)
    expect(build.mainEchoId).toBe('boss')
    expect(build.picks).toHaveLength(5)
  })

  it('속성이 다른 피해 보너스 메인은 쓰지 않는다', () => {
    const build = buildForCharacter(hero, [echo(3, 'wind', '용융 피해 보너스', good)])
    expect(build).toBeNull()
  })
})

describe('세트 직접 고르기', () => {
  it('먼저 고른 세트의 에코를 점수보다 우선해서 쓴다', () => {
    const items = [
      echo(4, 'fire', '크리티컬', good),
      echo(4, 'wind', '크리티컬', ok),
      echo(3, 'fire', '기류 피해 보너스', good),
      echo(3, 'wind', '기류 피해 보너스', ok),
    ]
    const build = buildForCharacter(hero, items, { setIds: ['wind', 'fire'] })
    const sets = build.picks.filter((p) => p.item).map((p) => p.item.setId)
    expect(sets.filter((s) => s === 'wind')).toHaveLength(2)
  })
})
