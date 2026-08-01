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
  // 조합을 바꿔 쓸 수 있는 캐릭터 예시(둘 이상이면 클릭해서 고를 수 있는 팝업이 뜸):
  // someCharacter: {
  //   combos: [
  //     defineCombo(['some-set-a', 2], ['some-set-b', 3]),
  //     defineCombo(['some-set-c', 2], ['some-set-d', 2], ['some-set-e', 1]),
  //   ],
  // },

  // 기류
  jiyan: { combos: [defineCombo(['sierra-gale', 5])] },
  ciaccona: { combos: [defineCombo(['gusts-of-welkin', 5])] },
  cartethyia: { combos: [defineCombo(['windward-pilgrimage', 5])] },
  rover_aero: {
    combos: [
      defineCombo(['windward-pilgrimage', 5]),
      defineCombo(['rejuvenating-glow', 5]),
    ],
  },
  iuno: {
    combos: [
      defineCombo(['crown-of-valor', 3], ['sierra-gale', 2]),
      defineCombo(['crown-of-valor', 3], ['gusts-of-welkin', 2]),
      defineCombo(['crown-of-valor', 3], ['windward-pilgrimage', 2]),
      defineCombo(['moonlit-clouds', 5]),
    ],
  },
  qiuyuan: {
    combos: [
      defineCombo(['law-of-harmony', 3], ['sierra-gale', 2]),
      defineCombo(['law-of-harmony', 3], ['gusts-of-welkin', 2]),
      defineCombo(['law-of-harmony', 3], ['windward-pilgrimage', 2]),
      defineCombo(['moonlit-clouds', 5]),
    ],
  },
  sigrika: { combos: [defineCombo(['sound-of-true-name', 5])] },
  // 기류

  // 용융
  encore: { combos: [defineCombo(['molten-rift', 5])] },
  changli: { combos: [defineCombo(['molten-rift', 5])] },
  brant: { combos: [defineCombo(['tidebreaking-courage', 5])] },
  lupa: { combos: [defineCombo(['flaming-clawprint', 5])] },
  galbrena: {
    combos: [
      defineCombo(['flamewings-shadow', 3], ['molten-rift', 2]),
      defineCombo(['flamewings-shadow', 3], ['flaming-clawprint', 2]),
    ],
  },
  mornye: { combos: [defineCombo(['halo-of-starry-radiance', 5])] },
  aemeath: {
    combos: [
      defineCombo(['trailblazing-star', 5]),
    ],
  },
  denia: {
    combos: [
      defineCombo(['chromatic-foam', 5]),
      defineCombo(['reel-of-spliced-memories', 5]),
    ],
  },
  // 용융

  // 응결
  zhezhi: {
    combos: [
      defineCombo(['moonlit-clouds', 5]),
      defineCombo(['empyrean-anthem', 5]),
    ],
  },
  carlotta: { combos: [defineCombo(['frosty-resolve', 5])] },
  lingyang: { combos: [defineCombo(['freezing-frost', 5])] },
  hiyuki: { combos: [defineCombo(['wishes-of-quiet-snowfall', 5])] },
  lucilla: {
    combos: [
      defineCombo(['wishes-of-quiet-snowfall', 5]),
      defineCombo(['moonlit-clouds', 5]),
    ],
  },
  suisui: { combos: [defineCombo(['song-of-feathered-trace', 5])] },
  // 응결

  // 전도
  yinlin: {
    combos: [
      defineCombo(['moonlit-clouds', 5]),
      defineCombo(['empyrean-anthem', 5]),
    ],
  },
  calcharo: { combos: [defineCombo(['void-thunder', 5])] },
  xiangli_yao: { combos: [defineCombo(['void-thunder', 5])] },
  augusta: { combos: [defineCombo(['crown-of-valor', 3], ['void-thunder', 2])] },
  rebecca: {
    combos: [
      defineCombo(['shadow-of-shattered-dreams', 1], ['lingering-tunes', 2], ['reel-of-spliced-memories', 2]),
    ],
  },
  rover_electro: { combos: [] },
  // 전도

  // 인멸
  rover_havoc: { combos: [defineCombo(['havoc-eclipse', 5])] },
  camellya: { combos: [defineCombo(['havoc-eclipse', 5])] },
  roccia: { combos: [defineCombo(['abyssal-veil', 5])] },
  cantarella: {
    combos: [
      defineCombo(['abyssal-veil', 5]),
      defineCombo(['moonlit-clouds', 5]),
    ],
  },
  phrolova: {
    combos: [
      defineCombo(['dream-of-the-lost', 3], ['havoc-eclipse', 2]),
      defineCombo(['dream-of-the-lost', 3], ['abyssal-veil', 2]),
    ],
  },
  chisa: {
    combos: [
      defineCombo(['thread-of-severed-fate', 3], ['havoc-eclipse', 2]),
      defineCombo(['thread-of-severed-fate', 3], ['abyssal-veil', 2]),
      defineCombo(['thread-of-severed-fate', 3], ['moonlit-clouds', 2]),
    ],
  },
  yangyang_xuanling: { combos: [defineCombo(['song-of-feathered-trace', 5])] },
  // 인멸

  // 회절
  rover_spectro: { combos: [defineCombo(['celestial-light', 5])] },
  verina: { combos: [defineCombo(['rejuvenating-glow', 5])] },
  jinhsi: { combos: [defineCombo(['celestial-light', 5])] },
  shorekeeper: { combos: [defineCombo(['rejuvenating-glow', 5])] },
  phoebe: { combos: [defineCombo(['eternal-radiance', 5])] },
  zeni: { combos: [defineCombo(['eternal-radiance', 5])] },
  lynae: { combos: [defineCombo(['pact-of-neonlight-leap', 5])] },
  luuk_herssen: { combos: [defineCombo(['rite-of-gilded-revelation', 5])] },
  lucy: {
    combos: [
      defineCombo(['shadow-of-shattered-dreams', 1], ['lingering-tunes', 2], ['reel-of-spliced-memories', 2]),
    ],
  },
  // 회절
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
