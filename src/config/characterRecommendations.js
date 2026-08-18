export const CHARACTER_RECOMMENDATIONS = {
  // 예시:
  // aemeath: {
  //   weapon: '추천 무기',
  //   echoSet: '추천 에코 세트',
  //   // echoMainStat: 코스트 조합별 추천 세팅 목록(최대 2개)입니다. 세팅이 하나뿐이면 배열에
  //   // 하나만 넣고, 코스트 조합은 같은데 세팅만 2가지면 cost를 똑같이, 코스트 조합 자체가
  //   // 2가지면 cost를 다르게 넣으세요. 화면에서 자동으로 표(1줄/세로 병합/2줄)로 그려집니다.
  //   echoMainStat: [{ cost: '43111', stats: '크피/속/속/공/공' }, { cost: '43111', stats: '크확/속/공/공/공' }],
  //   critRatio: '크리50% / 크피 270%',
  //   resonanceEfficiency: '120%',
  //   atk: '공격력 2500',
  //   energyCost: '공효 150',
  //   notes: ['공명 해방 전 스택을 최대한 채우고 사용하세요.'],
  // },
  // 기류
  jiyan: {
    weapon: '청룡의 천장[전무], 푸른물결의 빛[상시], 가을의 무늬[패스]',
    echoSet: '스쳐가는 바람 (4/3/3/1/1)',
    echoMainStat: [{ cost: '43111', stats: '크확 / 기류피증 / 공퍼'}],
    critRatio: '크확 70% / 크피 260%',
    resonanceEfficiency: '130%',
    atk: '2250',
    energyCost: '125',
    notes: ['1체인 이상이면 공명 스킬 충전 1회가 추가돼서, 요구 공명 효율 수치가 낮아집니다.'],
  },
  ciaccona: { weapon: '숲속의 아리아[전무], 부동의 안개[상시], 화려한 악곡[4성]', echoSet: '끝없는 하늘[43311]', echoMainStat: [{ cost: '43111', stats: '크확 / 기류피증 / 공퍼'}], critRatio: '크확 75% / 크피 275%', resonanceEfficiency: '120~', atk: '2100[속공] 1800[속속]', energyCost: '125', notes: ['카르티시아 전용 서포터로 사용'] },
  cartethyia: { weapon: '숙명에 맞서는 관 [전무], 날카로운 봄[카멜]', echoSet: '영광이 깃든 바람[44111]', echoMainStat: [{ cost: '43111', stats: '크확 / 1코스트 체% / 3코스트 피증'}], critRatio: '크확 70% / 크피 260%', resonanceEfficiency: '120', atk: '50000[44111]', energyCost: '120', notes: ['샤콘과 기류 방랑자 파티 사용\n 43111은 카멜 전무용임 전무는 44111'] },
  rover_aero: { weapon: '혈맹의 약속[전무], 천년의 회류[상시], 행진의 서곡[4성]', echoSet: '영광이 깃든 바람[43311] / 찬란한 광휘[43311]', echoMainStat: [{ cost: '43111', stats: '크확크피 / 기류피증 / 공퍼공효'}], critRatio: '크확 60% / 크피 200%', resonanceEfficiency: '150[피증+공%] 200[피증+공효]', atk: '1900', energyCost: '150', notes: ['찬란한 광휘 사용시 기존 힐러 세팅 그대로'] },
  iuno: { weapon: '세상 만물의 진리[전무], 팔방의 천추[상리요], 불빛의 심판[젠니], 물결의 파동[상시]', echoSet: '영광의 칼날로 만들어진 왕관[3세트(크피20%)] / 스쳐가는 바람[2세트] or 끝없는 하늘[2세트] or 영광이 깃든 바람[2세트] / 떠오르는 구름[43311]', echoMainStat: '크피 기류피증 기류피증 기류피증 공퍼', critRatio: '크확 80% / 크피 260%', resonanceEfficiency: '130~', atk: '2300[속공] 2000[속속]', energyCost: '125', notes: [] },
  qiuyuan: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  sigrika: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  // 기류

  // 용융
  encore: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  changli: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  brant: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  lupa: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  galbrena: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  mornye: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  aemeath: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  denia: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  // 용융

  // 응결
  zhezhi: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  carlotta: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  lingyang: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  hiyuki: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  lucilla: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  suisui: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  // 응결

  // 전도
  yinlin: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  calcharo: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  xiangli_yao: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  augusta: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  rebecca: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  rover_electro: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  // 전도

  // 인멸
  rover_havoc: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  camellya: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  roccia: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  cantarella: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  phrolova: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  chisa: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  yangyang_xuanling: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  // 인멸

  // 회절
  rover_spectro: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  verina: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  jinhsi: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  shorekeeper: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  phoebe: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  zeni: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  lynae: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  luuk_herssen: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  lucy: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  // 회절
}

export function getCharacterRecommendation(characterId) {
  return CHARACTER_RECOMMENDATIONS[characterId] ?? null
}
