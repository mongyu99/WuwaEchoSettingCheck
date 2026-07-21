/**
 * 특정 캐릭터가 특정 메인 에코를 사용할 때 데미지가 증가하는 계산식을 담는 틀입니다. 지금은
 * 실제 수치가 없어 비어 있고, 항목을 채우면 그대로 동작합니다.
 * key는 "캐릭터ID:메인에코ID" 형태이고, 값은 (stats) => 증가하는 데미지 보너스(%)를 반환하는
 * 함수입니다. stats에는 { atk, def, hp, critRate, critDmg }가 들어옵니다.
 */
export const CHARACTER_MAIN_ECHO_BONUS = {
  // 예시: '능양:main-echo-a': (stats) => stats.atk * 0.05, // 공격력의 5%만큼 데미지 보너스
}

export function getMainEchoDamageBonus(characterId, mainEchoId, stats) {
  if (!characterId || !mainEchoId) return null
  const fn = CHARACTER_MAIN_ECHO_BONUS[`${characterId}:${mainEchoId}`]
  return fn ? fn(stats) : null
}
