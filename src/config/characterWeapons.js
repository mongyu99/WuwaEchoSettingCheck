import { catalog } from './catalog'

// 캐릭터별 추천 무기 (DB: chara_recommended_weapon)
export const CHARACTER_WEAPONS = catalog.characterWeapons

/** 이 캐릭터가 쓸 수 있는 무기 id 목록을 반환합니다(등록 안 됐으면 null — weaponType 기준으로 대체). */
export function getCharacterWeaponIds(characterId) {
  return CHARACTER_WEAPONS[characterId] ?? null
}
