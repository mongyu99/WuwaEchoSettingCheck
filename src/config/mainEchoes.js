/**
 * 메인 에코(4코스트, 고유 스킬 데미지를 가진 에코) 카탈로그입니다. 지금은 UI 자리만 먼저 잡아둔
 * 상태라 이름이 자리표시자이고, 아이콘·실제 스킬 데이터는 비어 있습니다.
 *
 * echoSetId를 채우면 그 에코 세트를 골랐을 때 자동으로 이 메인 에코가 적용됩니다(수동 선택 없이
 * "사용 에코 세트"만 고르면 메인 에코가 따라감). 세트당 메인 에코는 하나만 매칭됩니다.
 */
export const MAIN_ECHOES = {
  'main-echo-a': { name: '메인 에코 A (자리표시자)' /* , echoSetId: 'long-journey-star' */ },
  'main-echo-b': { name: '메인 에코 B (자리표시자)' },
  'main-echo-c': { name: '메인 에코 C (자리표시자)' },
}

export function getMainEcho(id) {
  return MAIN_ECHOES[id] ?? null
}

/** 이 에코 세트에 연결된 메인 에코 id를 반환합니다(없으면 null). */
export function getMainEchoForSet(echoSetId) {
  if (!echoSetId) return null
  const entry = Object.entries(MAIN_ECHOES).find(([, e]) => e.echoSetId === echoSetId)
  return entry ? entry[0] : null
}
