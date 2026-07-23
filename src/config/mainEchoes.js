/**
 * 메인 에코(4코스트, 고유 스킬 데미지를 가진 에코) 카탈로그입니다.
 *
 * echoSetId를 채우면 그 에코 세트를 골랐을 때 자동으로 이 메인 에코가 적용됩니다(수동 선택 없이
 * "사용 에코 세트"만 고르면 메인 에코가 따라감). 세트당 메인 에코는 하나만 매칭됩니다.
 *
 * bonuses는 이 메인 에코를 장착하면 항상 붙는 % 보너스입니다(무기의 bonuses와 같은 방식으로
 * 합산 스탯에 더해집니다). category 이름은 StatsPage의 합산 스탯 카테고리 이름과 정확히 같아야
 * 합니다. 원래 게임 내 효과는 "장착 캐릭터가 OO일 경우"처럼 캐릭터 조건이 붙어 있지만, 에코 세트가
 * 캐릭터와 1:1로 묶여서 쓰이는 걸 전제로 하고 있어 여기서는 캐릭터 조건 없이 무조건 적용합니다.
 */
export const MAIN_ECHOES = {
  'z04-sigillum': {
    name: 'Z04-시길룸',
    icon: '/main-echoes/z04-sigillum.png',
    echoSetId: 'trailblazing-star',
    description:
      '에코 어빌리티를 사용하여 시길룸을 소환한 후, 적에게 1단 68.40%와 ' +
      '2단 205.20%의 ' + '용융 피해를 입힌다.',
    passiveDescription: '에이메스가 메인 슬롯에 장착 시 공명 해방 피해 보너스가 25.00% 증가한다.',
    bonuses: [{ category: '공명 해방 피해', value: 25 }],
  },
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

/**
 * 조합([{ setId, pieceCount }, ...]) 안의 세트들을 순서대로 훑어서, 메인 에코가 연결된 첫 세트의
 * 메인 에코 id를 반환합니다(없으면 null). 조합 하나에 메인 에코가 연결된 세트는 보통 하나뿐이라
 * "제일 많이 착용한 세트를 우선한다" 같은 규칙 없이 먼저 찾은 것을 그대로 씁니다.
 */
export function getMainEchoForCombo(combo) {
  for (const { setId } of combo ?? []) {
    const mainEchoId = getMainEchoForSet(setId)
    if (mainEchoId) return mainEchoId
  }
  return null
}
