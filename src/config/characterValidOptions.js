/**
 * 캐릭터별로 점수 계산에 반영할 "유효 옵션" 서브스탯 목록입니다.
 * 여기 이름이 없는 서브스탯은 해당 캐릭터 기준으로는 점수에 포함되지 않습니다.
 * (스탯명은 src/config/subStatOptions.js의 SUB_STAT_NAMES와 정확히 같은 문자열이어야 합니다.)
 *
 * 새 캐릭터를 추가하면 여기에도 캐릭터 id로 유효 옵션 배열을 추가해주세요.
 * 아래 두 캐릭터의 목록은 실제 세팅을 알려주시기 전까지의 예시값입니다 — 알려주시면 정확히 맞춰드릴게요.
 */
export const CHARACTER_VALID_OPTIONS = {
  deni: ['크리티컬%', '크리티컬 피해%', '공격력%', '공명 스킬 피해 보너스%', '일반 공격 피해 보너스%'],
  yangyang: ['크리티컬%', '크리티컬 피해%', '공격력%', '공명 효율%', '강공격 피해 보너스%'],
}

export function getValidOptions(characterId) {
  return CHARACTER_VALID_OPTIONS[characterId] ?? []
}
