import { catalog } from './catalog'

// 메인 에코 카탈로그 (DB: echo_info, echo_bonus, echo_chara_bonus, echo_chara_description)
export const MAIN_ECHOES = catalog.mainEchoes

export function getMainEcho(id) {
  return MAIN_ECHOES[id] ?? null
}
