import { catalog } from './catalog'

// 에코 세트 카탈로그 (DB: echo_set_info, echo_set_effect). pieces는 세트 개수별 효과이고,
// bonuses가 있는 단계만 계산에 반영됩니다(없으면 설명 문구만 표시).
export const ECHO_SETS = catalog.echoSets

export function getEchoSet(setId) {
  return ECHO_SETS[setId] ?? null
}
