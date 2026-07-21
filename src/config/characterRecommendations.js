/**
 * 캐릭터별 "제작자 추천" 빌드 정보입니다(추천 무기·에코 세트·에코 주옵·크확크피·공명 효율·
 * 공격력·공명 에너지 소모·참고사항). 게임 밸런스 변화나 개인 취향에 따라 달라질 수 있는 가이드성
 * 정보라 실제 검증된 값만 채워두고, 나머지는 비워둡니다 — 데이터를 알려주시면 채워서 바로
 * 보이게 만들 수 있어요.
 */
export const CHARACTER_RECOMMENDATIONS = {
  // 예시:
  // aemeath: {
  //   weapon: '영원한 샛별',
  //   echoSet: '긴 여정을 떠나는 별 5세트',
  //   echoMainStat: '크리티컬 피해 / 공격력',
  //   critRatio: '크리티컬 50% : 크리티컬 피해 100% 이상',
  //   resonanceEfficiency: '120%',
  //   atk: '2500 이상',
  //   energyCost: '150',
  //   notes: ['공명 해방 전 스택을 최대한 채우고 사용하세요.'],
  // },
}

export function getCharacterRecommendation(characterId) {
  return CHARACTER_RECOMMENDATIONS[characterId] ?? null
}
