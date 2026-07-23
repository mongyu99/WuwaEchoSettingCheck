import { getEchoSet } from './echoSets.js'

/**
 * 캐릭터별 에코 세트 "조합"입니다. 조합 하나는 [{ setId, pieceCount }, ...] 형태로, 여러 세트를
 * 섞어 쓰는 경우(2+3, 2+2+1 등)와 한 세트만 풀로 쓰는 경우(5) 전부 표현할 수 있습니다.
 *
 * 캐릭터는 보통 조합이 하나뿐이라 고정(에코 세트 표시를 클릭해도 아무 일도 없음)이지만, 조합을
 * 여러 개 등록하면 "사용 에코 세트"를 클릭했을 때 그 목록 중에서 바꿔 쓸 수 있는 팝업이 뜹니다.
 * 등록되지 않은 캐릭터는 에코 세트 정보가 아직 없다는 안내만 보여줍니다.
 */

/**
 * @param {...[string, number]} parts [세트 id, 착용 개수] 튜플들. 개수 합이 반드시 5여야 하고,
 *   같은 세트를 조합 안에서 두 번 쓸 수 없습니다(둘 다 어기면 에러를 던집니다).
 */
function defineCombo(...parts) {
  const combo = parts.map(([setId, pieceCount]) => ({ setId, pieceCount }))

  const total = combo.reduce((sum, p) => sum + p.pieceCount, 0)
  if (total !== 5) {
    throw new Error(`[characterEchoSets] 에코 세트 조합의 개수 합이 5가 아닙니다(${total}): ${combo.map((p) => p.setId).join(' + ')}`)
  }

  const seen = new Set()
  for (const p of combo) {
    if (seen.has(p.setId)) {
      throw new Error(`[characterEchoSets] 같은 세트를 조합 안에서 중복 사용했습니다: ${p.setId}`)
    }
    seen.add(p.setId)
  }

  return combo
}

export const CHARACTER_ECHO_SETS = {
  aemeath: {
    combos: [
      defineCombo(['trailblazing-star', 5]),
    ],
  },
  // 조합을 바꿔 쓸 수 있는 캐릭터 예시(둘 이상이면 클릭해서 고를 수 있는 팝업이 뜸):
  // someCharacter: {
  //   combos: [
  //     defineCombo(['some-set-a', 2], ['some-set-b', 3]),
  //     defineCombo(['some-set-c', 2], ['some-set-d', 2], ['some-set-e', 1]),
  //   ],
  // },
}

/** 이 캐릭터가 쓸 수 있는 에코 세트 조합 목록을 반환합니다(없으면 null). */
export function getCharacterEchoCombos(characterId) {
  return CHARACTER_ECHO_SETS[characterId]?.combos ?? null
}

/** 조합 하나를 "세트명(N) + 세트명(N)" 형태로 요약합니다(카드/팝업 표시용). */
export function describeCombo(combo) {
  return combo
    .map((p) => `${getEchoSet(p.setId)?.name ?? p.setId}(${p.pieceCount})`)
    .join(' + ')
}
