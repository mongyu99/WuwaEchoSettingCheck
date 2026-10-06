import { fetchCatalog } from '../utils/api'
import { assetPath } from './assetPath'

/**
 * DB(/api/catalog)에서 받은 게임 기준 데이터를 예전 config 파일과 같은 모양으로 묶어 담는 저장소입니다.
 * main.jsx가 앱을 그리기 전에 loadCatalog()를 먼저 끝내므로, 다른 config 모듈은 이 값을 바로 읽어도 됩니다.
 */
export const catalog = {
  characters: [],
  baseStats: {},
  validOptions: {},
  characterWeapons: {},
  characterEchoSets: {},
  weapons: {},
  echoSets: {},
  mainEchoes: {},
  echoSetMainEchoes: {},
}

const num = (v) => (v === null || v === undefined ? null : Number(v))
const bonus = (r) => ({ category: r.category, value: num(r.value) })

function groupBy(rows, key, allowed) {
  const map = {}
  for (const r of rows) {
    if (allowed && !allowed.has(r[key])) continue
    ;(map[r[key]] ??= []).push(r)
  }
  return map
}

export async function loadCatalog() {
  const d = await fetchCatalog()
  const charaIds = new Set(d.characters.map((c) => c.id))
  const weaponIds = new Set(d.weapons.map((w) => w.id))
  const echoIds = new Set(d.echoes.map((e) => e.id))
  const setIds = new Set(d.echoSets.map((s) => s.id))

  catalog.characters = d.characters.map((c) => ({
    id: c.id,
    name: c.name,
    rarity: c.rarity,
    element: c.element,
    weaponType: c.weapon_type ?? '',
    image: c.image_path ? assetPath(c.image_path) : null,
  }))

  const innate = groupBy(d.innateBonuses, 'chara_id', charaIds)
  catalog.baseStats = Object.fromEntries(
    d.characters
      .filter((c) => c.base_hp !== null)
      .map((c) => [
        c.id,
        {
          hp: num(c.base_hp),
          atk: num(c.base_atk),
          def: num(c.base_def),
          energyRegen: num(c.base_energy_regen),
          critRate: num(c.base_crit_rate),
          critDmg: num(c.base_crit_dmg),
          innateBonuses: (innate[c.id] ?? []).map(bonus),
        },
      ]),
  )

  catalog.validOptions = Object.fromEntries(
    Object.entries(groupBy(d.validOptions, 'chara_id', charaIds)).map(([id, rows]) => [id, rows.map((r) => r.label)]),
  )

  catalog.characterWeapons = Object.fromEntries(
    Object.entries(groupBy(d.recommendedWeapons, 'chara_id', charaIds)).map(([id, rows]) => [
      id,
      rows.filter((r) => weaponIds.has(r.weapon_id)).map((r) => r.weapon_id),
    ]),
  )

  catalog.characterEchoSets = Object.fromEntries(
    Object.entries(groupBy(d.echoComboParts, 'chara_id', charaIds)).map(([id, rows]) => {
      const combos = Object.values(groupBy(rows, 'combo_no'))
        .map((parts) => parts.filter((p) => setIds.has(p.set_id)).map((p) => ({ setId: p.set_id, pieceCount: p.piece_count })))
        .filter((combo) => combo.length > 0)
      return [id, { combos }]
    }),
  )

  const weaponBonuses = groupBy(d.weaponBonuses, 'weapon_id')
  catalog.weapons = Object.fromEntries(
    d.weapons.map((w) => [
      w.id,
      {
        name: w.name,
        type: w.type,
        icon: w.icon_path ? assetPath(w.icon_path) : null,
        atk: num(w.atk),
        ...(w.sub_stat ? { subStat: { category: w.sub_stat, value: num(w.sub_stat_value) } } : {}),
        bonuses: (weaponBonuses[w.id] ?? []).map(bonus),
        ...(w.passive_name ? { passiveName: w.passive_name } : {}),
        description: w.description,
        ...(w.note ? { note: w.note } : {}),
      },
    ]),
  )

  const effects = groupBy(d.echoSetEffects, 'set_id')
  catalog.echoSets = Object.fromEntries(
    d.echoSets.map((s) => [
      s.id,
      {
        name: s.name,
        icon: s.icon_path ? assetPath(s.icon_path) : null,
        pieces: Object.fromEntries(
          (effects[s.id] ?? []).map((e) => [
            e.piece_count,
            { ...(e.category ? { bonuses: [bonus(e)] } : {}), description: e.description },
          ]),
        ),
      },
    ]),
  )

  const echoBonuses = groupBy(d.echoBonuses, 'echo_id')
  const charaBonuses = groupBy(d.echoCharaBonuses.filter((r) => charaIds.has(r.chara_id)), 'echo_id')
  const charaDescriptions = groupBy(d.echoCharaDescriptions.filter((r) => charaIds.has(r.chara_id)), 'echo_id')
  catalog.mainEchoes = Object.fromEntries(
    d.echoes.map((e) => {
      const cb = charaBonuses[e.id] ?? []
      const cbCharaIds = [...new Set(cb.map((r) => r.chara_id))]
      const cd = charaDescriptions[e.id] ?? []
      return [
        e.id,
        {
          name: e.name,
          icon: e.icon_path ? assetPath(e.icon_path) : null,
          description: e.description,
          passiveDescription: e.passive_description ?? null,
          bonuses: (echoBonuses[e.id] ?? []).map(bonus),
          ...(cbCharaIds.length
            ? {
                characterBonus: {
                  characterIds: cbCharaIds,
                  bonuses: cb.filter((r) => r.chara_id === cbCharaIds[0]).map(bonus),
                },
              }
            : {}),
          ...(cd.length ? { characterDescriptions: Object.fromEntries(cd.map((r) => [r.chara_id, r.description])) } : {}),
        },
      ]
    }),
  )

  catalog.echoSetMainEchoes = Object.fromEntries(
    Object.entries(groupBy(d.echoSetMainEchoes, 'set_id', setIds)).map(([id, rows]) => [
      id,
      rows.filter((r) => echoIds.has(r.echo_id)).map((r) => r.echo_id),
    ]),
  )
}
