/**
 * 캐릭터별로 실제 사용 가능한 에코 세트 목록입니다(예: 이 캐릭터는 A, B 세트만 사용 가능).
 * "사용 에코 세트" select의 옵션을 이 목록으로 제한합니다. 여기 등록되지 않은 캐릭터는 제한 없이
 * 카탈로그의 모든 에코 세트를 고를 수 있습니다 — 데이터를 알려주시면 채워서 제한할 수 있어요.
 */
export const CHARACTER_ECHO_SETS = {
  // 예시: aemeath: ['long-journey-star'],
}

export function getAllowedEchoSetIds(characterId) {
  return CHARACTER_ECHO_SETS[characterId] ?? null
}
