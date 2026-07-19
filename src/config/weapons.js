/**
 * 무기 카탈로그입니다. atk는 플랫 공격력, subStat은 무기의 부스탯(% 카테고리에 더해짐),
 * bonuses는 무기 패시브로 항상 붙는 % 보너스입니다. category 이름은 StatsPage의 합산 스탯
 * 카테고리 이름과 정확히 같아야 합니다.
 */
export const WEAPONS = {
  'eternal-radiance': {
    name: '영원한 샛별',
    type: '직검',
    icon: '/weapons/eternal-radiance.png',
    atk: 587,
    subStat: { category: '크리티컬', value: 24.3 },
    bonuses: [{ category: '속성 피해 보너스', value: 12 }],
    passiveName: '별을 좇아서',
    description:
      '전체 속성 피해 보너스가 12% 증가된다. 조화 파동·이탈 혹은 불꽃 효과 추가 시, 공명 해방 ' +
      '피해는 목표의 32% 방어력과 10%의 용융 저항을 무시하고, 8초간 지속된다.',
    note: '방어력·저항 무시 효과는 계산에 반영하지 않고 안내 문구로만 보여드립니다. 실제 적용되는 수치는 속성 피해 보너스 12%뿐입니다.',
  },
}

export function getWeapon(weaponId) {
  return WEAPONS[weaponId] ?? null
}
