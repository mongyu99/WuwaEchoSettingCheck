/**
 * 캐릭터별 기초 스탯(장비 적용 전)과, 그 캐릭터 고유의 스킬/특성으로 항상 붙는 % 보너스입니다.
 * 여기 없는 캐릭터는 기초 스탯 없이(0) 표시되니, 알려주시면 채워드릴게요.
 *
 * innateBonuses의 category는 StatsPage의 합산 스탯 카테고리 이름과 정확히 같아야 합니다
 * (HP / 공격력 / 방어력 / 공명 효율 / 크리티컬 / 크리티컬 피해 / 속성 피해 보너스 / 에코 피해 /
 * 일반 공격 피해 / 강공격 피해 / 공명 스킬 피해 / 공명 해방 피해).
 */
export const CHARACTER_BASE_STATS = {
  에이메스: {
    hp: 11025,
    atk: 425,
    def: 1148,
    energyRegen: 100.0,
    critRate: 5.0,
    critDmg: 150.0,
    innateBonuses: [
      { category: '크리티컬', value: 8.0 },
      { category: '공격력', value: 12.0 },
    ],
  },
}

export function getCharacterBaseStats(characterId) {
  return CHARACTER_BASE_STATS[characterId] ?? null
}
