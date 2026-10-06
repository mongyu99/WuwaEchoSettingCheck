import { catalog } from './catalog'

// 무기 카탈로그 (DB: weapon_info, weapon_bonus)
export const WEAPONS = catalog.weapons

export function getWeapon(weaponId) {
  return WEAPONS[weaponId] ?? null
}
