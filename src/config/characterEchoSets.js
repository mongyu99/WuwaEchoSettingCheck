import { catalog } from './catalog'
import { getEchoSet } from './echoSets.js'

// 캐릭터별 추천 에코 세트 조합 (DB: chara_echo_combo_part). 조합 하나는 [{ setId, pieceCount }, ...]
export const CHARACTER_ECHO_SETS = catalog.characterEchoSets

/** 이 캐릭터가 쓸 수 있는 에코 세트 조합 목록을 반환합니다(없으면 null). */
export function getCharacterEchoCombos(characterId) {
  return CHARACTER_ECHO_SETS[characterId]?.combos ?? null
}

/** 조합 하나를 "세트명(N) + 세트명(N)" 형태로 요약합니다(카드/팝업 표시용). */
export function describeCombo(combo) {
  return combo.map((p) => `${getEchoSet(p.setId)?.name ?? p.setId}(${p.pieceCount})`).join(' + ')
}
