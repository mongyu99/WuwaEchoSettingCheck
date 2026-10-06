import { catalog } from './catalog'

// 캐릭터별 기초 스탯 + 고유 % 보너스 (DB: chara_info, chara_innate_bonus)
export const CHARACTER_BASE_STATS = catalog.baseStats

export function getCharacterBaseStats(characterId) {
  return CHARACTER_BASE_STATS[characterId] ?? null
}
