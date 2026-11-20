// 캐릭터 추천: 가방에 모은 에코로 캐릭터 한 명에게 끼울 5개 조합(4-3-3-1-1 또는 4-4-1-1-1)을 짭니다.
// - 메인 에코 자리는 그 캐릭터의 메인 에코(캐릭터 전용 보너스 에코 → 추천 세트의 메인 에코 순)로 고정합니다.
// - 세트는 캐릭터 추천 세트 조합(예: A 5개, A 2개 + B 3개)을 맞춥니다.
// - 그 조건 안에서 캐릭터 기준 유효 옵션 점수 합이 가장 높은 조합을 고릅니다. 다른 캐릭터와 에코가 겹쳐도 됩니다.
import { getValidOptions } from '../config/characterValidOptions'
import { getCharacterEchoCombos } from '../config/characterEchoSets'
import { ECHO_SET_MAIN_ECHOES } from '../config/echoSetMainEchoes'
import { MAIN_ECHOES } from '../config/mainEchoes'
import { mainFits } from './echoRecommend'
import { scoreValidStats } from './echoScore'

// 코스트 배치: 화면에서 4-3-3-1-1 / 4-4-1-1-1 중 골라서 짭니다(기본 4-3-3-1-1).
export const LAYOUTS = { '43311': [4, 3, 3, 1, 1], '44111': [4, 4, 1, 1, 1] }
// 자리마다 후보를 세트별·전체에서 점수 상위 몇 개만 남겨 조합합니다(수천 개를 다 조합하면 너무 많아서).
const TOP_PER_GROUP = 4

/** 이 캐릭터의 메인 에코 후보(우선순위 순). 캐릭터 전용 보너스가 있는 에코가 먼저, 그다음 추천 세트의 메인 에코입니다. */
export function mainEchoCandidates(character, combo) {
  const own = Object.entries(MAIN_ECHOES)
    .filter(([, echo]) => echo.characterBonus?.characterIds.includes(character.id))
    .map(([id]) => id)
  const fromSets = combo.flatMap((part) => ECHO_SET_MAIN_ECHOES[part.setId] ?? [])
  return [...new Set([...own, ...fromSets])]
}

const topN = (list) => list.slice(0, TOP_PER_GROUP)

/**
 * 자리(코스트)마다 넣어 볼 후보: 조합 세트별 상위 몇 개.
 * 조합 세트로 5자리가 다 정해지는 경우(5세트, 2+3세트)는 다른 세트 에코를 넣지 않습니다(모자라면 빈자리).
 * 세트가 일부만 정해진 경우(예: 3세트만)에만 남는 자리에 세트 무관 상위를 넣어 봅니다.
 */
function poolFor(cost, scored, combo, exclude) {
  const ofCost = scored.filter((s) => Number(s.item.cost) === cost && s !== exclude)
  const fixedPieces = combo.reduce((sum, part) => sum + part.pieceCount, 0)
  const picked = new Set(fixedPieces >= 5 ? [] : topN(ofCost))
  for (const part of combo) topN(ofCost.filter((s) => s.item.setId === part.setId)).forEach((s) => picked.add(s))
  return [...picked].sort((a, b) => b.score - a.score)
}

const setsSatisfied = (chosen, combo) =>
  combo.every((part) => chosen.filter((s) => s.item?.setId === part.setId).length >= part.pieceCount)

/** 메인 자리를 뺀 나머지 자리를 채우는 가장 높은 점수 조합(세트 조건 만족). 없으면 null. */
// prioritySet: 세트를 직접 고른 경우 맨 처음 고른 세트. 그 세트 에코를 더 많이 쓴 조합을 점수보다 먼저 봅니다.
function bestFill(slots, scored, combo, main, requireSets, prioritySet = null) {
  const pools = slots.map((cost) => poolFor(cost, scored, combo, main))
  let best = null
  const chosen = main ? [main] : []
  const walk = (i, minIndexByCost) => {
    if (i === slots.length) {
      if (requireSets && !setsSatisfied(chosen, combo)) return
      const total = chosen.reduce((sum, s) => sum + s.score, 0)
      const priority = prioritySet ? chosen.filter((s) => s.item?.setId === prioritySet).length : 0
      if (!best || priority > best.priority || (priority === best.priority && total > best.total)) {
        best = { picks: [...chosen], total, priority }
      }
      return
    }
    const cost = slots[i]
    // 같은 코스트 자리끼리는 순서만 바뀐 같은 조합을 두 번 보지 않게, 후보 번호가 커지는 방향으로만 고릅니다.
    const start = minIndexByCost[cost] ?? 0
    let tried = false
    pools[i].forEach((cand, idx) => {
      if (idx < start || chosen.includes(cand)) return
      tried = true
      chosen.push(cand)
      walk(i + 1, { ...minIndexByCost, [cost]: idx + 1 })
      chosen.pop()
    })
    // 이 자리에 넣을 에코가 더 없으면(예: 3코 자리는 2개인데 맞는 3코 에코가 1개) 빈자리로 두고 나머지를 채웁니다(빈자리는 0점).
    if (!tried) {
      chosen.push({ item: null, empty: true, cost, score: 0, rows: [] })
      walk(i + 1, { ...minIndexByCost, [cost]: pools[i].length })
      chosen.pop()
    }
  }
  walk(0, {})
  return best
}

/**
 * 캐릭터 한 명의 추천 조합을 만듭니다.
 * 반환: { picks: [{ item, score, rows, isMain }], total, combo, layout, mainEchoId, mainMissing, setsMet } 또는 null(후보 없음)
 * - mainMissing: 가방에 메인 에코가 없어 메인 자리를 일반 에코로 채운 경우 true(이때 mainEchoId는 갖춰야 할 에코)
 * - setsMet: 세트 조건을 못 맞춰 세트 무관으로 짠 경우 false
 */
// setIds를 주면(세트 직접 고르기) 그 세트의 에코만 쓰고, 세트 개수 조건 없이 점수가 가장 높은 조합을 짭니다.
export function buildForCharacter(character, items, { setIds = null, layoutKey = '43311' } = {}) {
  const valid = getValidOptions(character.id)
  const scored = items
    .filter((item) => item.cost && mainFits(character, item.main?.label))
    .filter((item) => !setIds || setIds.includes(item.setId))
    .map((item) => {
      const { rows, total } = scoreValidStats(item.subStats, valid)
      return { item, score: total, rows }
    })
    .sort((a, b) => b.score - a.score)
  if (scored.length === 0) return null

  const recommended = getCharacterEchoCombos(character.id)
  const combos = setIds
    ? [setIds.map((setId) => ({ setId, pieceCount: 0 }))] // 고른 세트 안에서는 개수 조건 없음(메인 에코 후보만 이 세트로 찾음)
    : recommended?.length
      ? recommended
      : [[]]
  let best = null
  const better = (cand) =>
    !best ||
    // 메인 에코를 갖춘 조합 > 세트를 맞춘 조합 > 점수
    Number(!cand.mainMissing) - Number(!best.mainMissing) ||
    Number(cand.setsMet) - Number(best.setsMet) ||
    (cand.priority ?? 0) - (best.priority ?? 0) ||
    cand.total - best.total

  for (const combo of combos) {
    const candidates = mainEchoCandidates(character, combo)
    // 가방에 있는 것 중 우선순위가 가장 높은 메인 에코를 씁니다(그 에코 중에서는 점수가 가장 높은 것).
    const mainEchoId = candidates.find((id) => scored.some((s) => s.item.echoId === id)) ?? null
    const mainOptions = mainEchoId ? scored.filter((s) => s.item.echoId === mainEchoId) : [null]

    for (const layout of [LAYOUTS[layoutKey] ?? LAYOUTS['43311']]) {
      for (const main of mainOptions) {
        const slots = [...layout]
        if (main) {
          const at = slots.indexOf(Number(main.item.cost))
          if (at < 0) continue // 이 배치에는 메인 에코 코스트 자리가 없음
          slots.splice(at, 1)
        }
        for (const requireSets of [true, false]) {
          const fill = bestFill(slots, scored, combo, main, requireSets, setIds?.[0] ?? null)
          if (!fill) continue
          const cand = {
            picks: fill.picks.map((s) => ({ ...s, isMain: s === main })),
            total: fill.total,
            priority: fill.priority,
            combo,
            layout,
            mainEchoId: mainEchoId ?? candidates[0] ?? null,
            mainMissing: !main,
            setsMet: requireSets,
          }
          if (better(cand) > 0) best = cand
          break // 세트 개수를 맞춘 조합이 있으면 개수가 모자란 조합은 볼 필요 없음
        }
      }
    }
  }
  if (best) {
    // 메인 에코를 맨 앞, 나머지는 코스트 높은 순으로 보여 줍니다.
    best.picks.sort(
      (a, b) =>
        Number(b.isMain) - Number(a.isMain) || Number(b.item?.cost ?? b.cost) - Number(a.item?.cost ?? a.cost) || b.score - a.score,
    )
  }
  return best
}
