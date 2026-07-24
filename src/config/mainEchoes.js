/**
 * 메인 에코(4코스트, 고유 스킬 데미지를 가진 에코) 카탈로그입니다. 어떤 에코 세트를 고르면 이
 * 메인 에코가 자동으로 딸려오는지는 여기서 다루지 않습니다 — 그 연결은
 * config/echoSetMainEchoes.js가 전담합니다.
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
