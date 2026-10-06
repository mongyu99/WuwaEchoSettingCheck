import { catalog } from './catalog'

// 등록 안 된 캐릭터는 공격력 스케일링 기본값을 씁니다(대부분의 딜러가 공격력 스케일링).
const DEFAULT_ATK_OPTIONS = ['크리티컬%', '크리티컬 피해%', '공격력%', '공명 효율%', '공격력']

// 캐릭터별 유효 옵션 (DB: chara_valid_option)
export const CHARACTER_VALID_OPTIONS = catalog.validOptions

export function getValidOptions(characterId) {
  return CHARACTER_VALID_OPTIONS[characterId] ?? DEFAULT_ATK_OPTIONS
}
