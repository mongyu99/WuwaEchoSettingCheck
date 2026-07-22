/**
 * 에코 세트 카탈로그입니다. 1세트/5세트 효과는 지금은 다루지 않고, 2세트 효과만 계산합니다
 * (5세트는 항상 없다고 가정). category 이름은 StatsPage의 합산 스탯 카테고리 이름과 정확히
 * 같아야 합니다.
 */
/**
 * 에코 세트 카탈로그입니다. pieces는 세트 개수(1/2/5)별 효과를 담는 확장 가능한 구조입니다 —
 * 지금은 2/5세트만 채워뒀고, 나중에 1세트 효과가 생기면 pieces[1]에 추가하면 됩니다.
 * 몇 세트를 선택하든 그 이하 단계 효과는 전부 함께 적용됩니다(5세트 선택 시 2세트 효과도 적용).
 * category 이름은 StatsPage의 합산 스탯 카테고리 이름과 정확히 같아야 합니다.
 */
export const ECHO_SETS = {
  'molten-rift': {
    name: '솟구치는 용암',
    icon: '/echo-sets/molten-rift.png',
    pieces: {
      2: {
        bonuses: [{ category: '속성 피해 보너스', value: 10 }],
        description: '용융 피해가 10% 증가된다',
      },
      5: {
        description: '공명 스킬 사용 시, 용융 피해가 30% 증가되며, 15초 동안 지속된다',
      },
    },
  },
  'molten-rift': {
    name: '솟구치는 용암',
    icon: '/echo-sets/molten-rift.png',
    pieces: {
      2: {
        bonuses: [{ category: '속성 피해 보너스', value: 10 }],
        description: '용융 피해가 10% 증가된다',
      },
      5: {
        description: '공명 스킬 사용 시, 용융 피해가 30% 증가되며, 15초 동안 지속된다',
      },
    },
  },
  'freezing-frost': {
    name: '야밤의 서리',
    icon: '/echo-sets/freezing-frost.png',
    pieces: {
      2: {
        bonuses: [{ category: '속성 피해 보너스', value: 10 }],
        description: '응결 피해가 10% 증가된다',
      },
      5: {
        description:
          '일반 공격이나 강공격을 사용하면, 응결 피해가 10% 증가' +
          '해당 효과는 3스택 중첩이 가능하며, 15초간 지속된다',
      },
    },
  },
  'long-journey-star': {
    name: '긴 여정을 떠나는 별',
    icon: '/echo-sets/trailblazing-star.png',
    pieces: {
      2: {
        bonuses: [{ category: '속성 피해 보너스', value: 10 }],
        description: '용융 피해가 10% 증가한다',
      },
      5: {
        description:
          '캐릭터가 적에게 「불꽃 효과」 혹은 「조화 파동·이탈」 추가 시, 자신의 크리티컬이 20% 증가되고 ' +
          '용융 피해가 20% 증가되며, 8초간 지속된다',
      },
    },
  },
}

export function getEchoSet(setId) {
  return ECHO_SETS[setId] ?? null
}
