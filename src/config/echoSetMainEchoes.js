import { catalog } from './catalog'

// 에코 세트 ↔ 메인 에코 연결 (DB: echo_set_main_echo)
export const ECHO_SET_MAIN_ECHOES = catalog.echoSetMainEchoes

export function getMainEchoIdsForCombo(combo) {
  const ids = []
  const seen = new Set()
  for (const { setId } of combo ?? []) {
    for (const id of ECHO_SET_MAIN_ECHOES[setId] ?? []) {
      if (seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
  }
  return ids
}

export function getMainEchoIdForCombo(combo) {
  return getMainEchoIdsForCombo(combo)[0] ?? null
}
