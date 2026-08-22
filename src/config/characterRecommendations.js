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
  //   def: '방어력 1200', // 방어력 스탯이 유효한 캐릭터만 채우면 됩니다. 없으면 빈 문자열로 두세요.
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
  iuno: { weapon: '세상 만물의 진리[전무], 팔방의 천추[상리요], 불빛의 심판[젠니], 물결의 파동[상시]', echoSet: '영광의 칼날로 만들어진 왕관[3세트(크피20%)] 스쳐가는 바람[2세트] or 끝없는 하늘[2세트] or 영광이 깃든 바람[2세트] / 떠오르는 구름[43311]', echoMainStat: '크피 기류피증/기류피증 기류피증/공퍼', critRatio: '크확 80% / 크피 260%', resonanceEfficiency: '130~', atk: '2300[속공] 2000[속속]', energyCost: '125', notes: [] },
  qiuyuan: { weapon: '푸른 의지[전무], 날카로운 봄[카멜리아], 솟아오르는 화염[장리], 천년의 회류[상시]', echoSet: '만물의 숨결에 비롯된 울림[3세트] 스쳐가는 바람[2세트] or 끝없는 하늘[2세트] or 영광이 깃든 바람[2세트] / 떠오르는 구름[43311]', echoMainStat: '크피 기류피증/기류피증 기류피증/공퍼', critRatio: '크확 70% / 크피 260%', resonanceEfficiency: '130~', atk: '2350[속공] 2050[속속]', energyCost: '125', notes: ['떠오르는 구름 세트 사용시 파티딜이 더 높고 공명 효율 요구치 10% 감소'] },
  sigrika: { weapon: '솔스원의 해석[전무], 불빛의 심판[젠니], 한낮의 의지[루크]', echoSet: '함의의 소리를 따라[43311]', echoMainStat: '크확 공효/공퍼 공퍼/공퍼', critRatio: '크확 70% / 크피 270%', resonanceEfficiency: '150', atk: '260', energyCost: '125', notes: ['부옵으로 공효 35% 이상 챙길 수 있으면 3코 공퍼 2개 채용 가능하다고 함 파수인 2돌이면 속성 피증, 공퍼가 우위 그리고 공명 스킬도 찍어줄 수 있으면 찍어주셈'] },
  // 기류

  // 용융
  encore: { weapon: '꼭두각시의 손, 옥수 비단, 파도의 기록, 청음', echoSet: '솟구치는 용암[43311]', echoMainStat: '크확/크피 용융피증/용융피증 용융피증/공퍼', critRatio: '크확 70% / 크피 270%', resonanceEfficiency: '120', atk: '1900', energyCost: '125', notes: ['2체인에 공명 에너지 회복이 달려있어서 2체인 이상이면 공효 요구치가 낮아짐'] },
  changli: { weapon: '솟아오르는 화염[전무], 천년의 회류[상시], 야귀의 신념[튜닝]', echoSet: '솟구치는 용암[43311]', echoMainStat: '크확/크피 용융피증/공퍼 공퍼/공퍼', critRatio: '크확 70% / 크피 260%', resonanceEfficiency: '120', atk: '2500', energyCost: '125', notes: ['2체인에 이화 획득시 크리 25퍼 증가가 있어서 2체인 이상이면 4코 주옵 크리피해 고려'] },
  brant: { weapon: '흔들리지 않는 용기[전무], 날카로운 봄[카멜리아],천년의 회류[상시], 행진의 서곡[4성]', echoSet: '파도에 맞선 용기[43311]', echoMainStat: '크확 공명효율/공명효율 공명효율/용융피증', critRatio: '크확 75% / 크피 220%', resonanceEfficiency: '270', atk: '1700[패시브X]', energyCost: '175', notes: ['일공피 >> 공% / 용융속성 전용 서포터로 사용하거나, 일반공격 피해 버프를 주는 아군과 사용 최대 공효 280 / 2체인 이상 크확 55 크피 260'] },
  lupa: { weapon: '불길[전무], 태평성대[금희], 청룡의 천장[기염], 푸른물결의 빛[상시]', echoSet: '울부짖는 늑대의 불꽃[43311]', echoMainStat: '크확/크피 용융피증/용융피증 용융피증/공퍼', critRatio: '크확 70% / 크피 260%', resonanceEfficiency: '120', atk: '2300[속공] 2000[속속]', energyCost: '125', notes: ['1체인에 크확 20퍼 증가가 있어서 1체인 이상이면 4코 주옵 크리피해를 쓸수도 있으나 4코 주옵은 크확이 정배 / 1체인 이상 + 파수인 편성 시 4코 크피 크확 50 크피 310'] },
  galbrena: { weapon: '얽혀진 빛과 그림자[전무], 죽음과 춤[카를로타], 부동의 안개[상시], 숲속의 아리아[샤콘]', echoSet: '불타는 깃털을 펼친 사냥꾼의 그림자[3세트(크확20%)] 솟구치는 용암[2세트] or 울부짖는 늑대의 불꽃[2세트]', echoMainStat: '크확 용융피증/용융피증 용융피증/공퍼', critRatio: '크확 60% / 크피 285%', resonanceEfficiency: '120~', atk: '2550[속공] 2250[속속]', energyCost: '125', notes: ['메인 에코는 3코 코로사우루스'] },
  mornye: { weapon: '별하늘 연산 측정기[전무], 기묘한 울림', echoSet: '빛을 쫓는 별의 고리[43311]', echoMainStat: '방어력 방어력 공효 방어력 방어력', critRatio: '크확 20%', resonanceEfficiency: '240', def: '3500', energyCost: '175', notes: [] },
  aemeath: { weapon: '영원한 샛별[전무], 천년의 회류[구상시], 날카로운 봄[카멜리아], 푸른 의지[구원]', echoSet: '긴 여정을 떠나는 별[43311]', echoMainStat: '크피 용융피증/공퍼 공퍼/공퍼', critRatio: '크확 70% / 크피 270%', resonanceEfficiency: '120~125', atk: '2600[공공] 2300[속공]', energyCost: '125', notes: [] },
  denia: { weapon: '위조된 작은별[전무], 꼭두각시의 손[음림], 잊혀진 피안의 슬픈 악장[플로로]', echoSet: '오색찬란한 거품[43311] / 마음을 엮은 꿈의 그림자[43311]', echoMainStat: '크피 용융피증/공퍼 용융피증/용융피증', critRatio: '크확 75% / 크피 275%', resonanceEfficiency: '120~125', atk: '2300[속공] 2000[속속]', energyCost: '125', notes: [] },
  // 용융

  // 응결
  zhezhi: { weapon: '옥수 비단[전무], 꼭두각시의 손[음림], 파도의 기록, 청음', echoSet: '떠오르는 구름[43311] 하늘의 합주곡[43311]', echoMainStat: '크확 응결피증/응결피증 응결피증/공퍼', critRatio: '크확 70% / 크피 290%', resonanceEfficiency: '130', atk: '1800', energyCost: '125', notes: ['1체인 이상인 경우 공효 요구치 낮아짐'] },
  carlotta: { weapon: '죽음의 춤[전무], 부동의 안개[상시], 뇌전', echoSet: '냉철한 결단[43311]', echoMainStat: '크확 응결피증/공퍼', critRatio: '크확 70% / 크피 290%', resonanceEfficiency: '130', atk: '2350', energyCost: '125', notes: ['절지랑 파티인 경우 공효 110이면 충분'] },
  lingyang: { weapon: '불빛의 심판[젠니], 팔방의 천추[상리요], 물결의 파동[상시], 천상의 나선[4성]', echoSet: '야밤의 서리[43311]', echoMainStat: '크확 응결피증/응결피증 응결피증/공퍼', critRatio: '크확 65% / 크피 240%', resonanceEfficiency: '120', atk: '2200', energyCost: '125', notes: [] },
  hiyuki: { weapon: '서린 불꽃[전무], 천년의 회류[구상시], 솟아오르는 화염[장리]', echoSet: '소리 없이 내려앉은 기도의 눈[43311]', echoMainStat: '크피 응결피증/공퍼 응결피증/응결피증', critRatio: '크확 75% / 크피 260%', resonanceEfficiency: '120[최소] 125[권장]', atk: '2500[속공] 2200[속속]', energyCost: '125', notes: ['풀돌은 4코 공퍼 사용 가능 공격력: 2850 / 크피: 215%'] },
  lucilla: { weapon: '프리즈 프레임[전무], 꼭두각시의 손[음림], 옥수 비단[절지]', echoSet: '소리 없이 내려앉은 기도의 눈[34311][서리모드] 떠오르는 구름[43311][에코모드]', echoMainStat: '크피 응결피증/응결피증 응결피증/공퍼', critRatio: '크확 75% / 크피 265%', resonanceEfficiency: '0', atk: '2100[속속] 2400[속공]', energyCost: '0', notes: ['서리모드 기도셋 메인 에코는 글로모스 풀돌이면 3코 공공'] },
  suisui: { weapon: '노을에 깃든 이슬[전무], 판타지 변주[4성]', echoSet: '내려앉은 깃털의 노래[33111]', echoMainStat: '공효 공효 체퍼 X 3', critRatio: '크확 20%', resonanceEfficiency: '260~', hp: '40000', energyCost: '175', notes: ['메인 에코는 봉정계유'] },
  // 응결

  // 전도
  yinlin: { weapon: '꼭두각시의 손[전무], 옥수 비단[절지], 파도의 기록, 청음', echoSet: '떠오르는 구름[43311] 하늘의 합주곡[43311]', echoMainStat: '크피 전도피증/전도피증 전도피증/공퍼', critRatio: '크확 80% / 크피 270%', resonanceEfficiency: '120', atk: '1850', energyCost: '125', notes: ['2체인 이상이면 공효 요구치가 낮아짐'] },
  calcharo: { weapon: '태평성대, 청룡의 천장, 푸른 물결의 빛, 가을의 무늬', echoSet: '울려퍼지는 뇌음[43311]', echoMainStat: '크피 전도피증/전도피증 전도피증/공퍼', critRatio: '크확 65% / 크피 260%', resonanceEfficiency: '130', atk: '2200', energyCost: '125', notes: ['1체인 이상이면 공효 요구치가 낮아짐'] },
  xiangli_yao: { weapon: '팔방의 천추[전무], 물결의 파동, 황금 권갑', echoSet: '울려퍼지는 뇌음[43311]', echoMainStat: '크피 전도피증/전도피증 전도피증/공퍼', critRatio: '크확 65% / 크피 280%', resonanceEfficiency: '120', atk: '2200', energyCost: '125', notes: [] },
  augusta: { weapon: '천둥벼락을 다스리는 권능[전무], 청룡의 천장[기염], 태평성대[금희], 푸른물결의 빛[상시]', echoSet: '영광의 칼날로 만들어진 왕관[3세트(크피20%)] 울려퍼지는 뇌음[2세트]', echoMainStat: '크확 전도피증/전도피증 전도피증/공퍼', critRatio: '크확 73% / 크피 220%', resonanceEfficiency: '125~', atk: '2750[속공] 2400[속속]', energyCost: '125', notes: ['2돌파: 4코 크리/크피 자유 풀돌: 4코 크피'] },
  rebecca: { weapon: '스컬 스래셔[전무], 부동의 안개[구상시], 위상의 파동[산상시]', echoSet: '꿈을 깨뜨리는 망령의 악몽[1세트(크확15%)] + 끊임없는 잔향[2세트] or 마음을 엮은 꿈의 그림자[2세트] / 마음을 엮은 꿈의 그림자[2세트] or 끊임없는 잔향[2세트]', echoMainStat: '크확 전도피증/전도피증 전도피증/공퍼', critRatio: '크확 70% / 크피 285%', resonanceEfficiency: '125~130', atk: '2100[속속] 2300[속공]', energyCost: '125', notes: ['2세트 속공 써도 됨 큰 차이 안 남'] },
  //rover_electro: { weapon: '', echoSet: '', echoMainStat: '', critRatio: '', resonanceEfficiency: '', atk: '', energyCost: '', notes: [] },
  // 전도

  // 인멸
  rover_havoc: { weapon: '천년의 회류[상시], 솟아오르는 화염[장리], 야귀의 신념', echoSet: '빛을 삼키는 해[43311]', echoMainStat: '크피 인멸피증/인멸피증 인멸피증/공퍼', critRatio: '크확 70% / 크피 270%', resonanceEfficiency: '120', atk: '2000', energyCost: '125', notes: ['6돌 + 상시 직검(or 패스 무기)일 경우 크피 옵션에 집중'] },
  camellya: { weapon: '날카로운 봄[전무], 천년의 회류[상시], 야귀의 신념', echoSet: '빛을 삼키는 해[43311]', echoMainStat: '크확/크피 인멸피증/인멸피증 인멸피증/공퍼', critRatio: '크확 65% / 크피 280%', resonanceEfficiency: '120', atk: '2450', energyCost: '125', notes: [] },
  roccia: { weapon: '희비극[전무], 팔방의 천추[상리요], 물결의 파동[상시], 황금 권갑', echoSet: '어둠의 장막[43311]', echoMainStat: '크확/크피 인멸피증/인멸피증 인멸피증/공퍼', critRatio: '크확 65% / 크피 280%', resonanceEfficiency: '130', atk: '2250', energyCost: '125', notes: ['구름 세트 기용시 공효 요구치 -10'] },
  cantarella: { weapon: '바다의 속삭임[전무], 꼭두각시의 손[음림], 파도의 기록, 청음', echoSet: '어둠의 장막[43311] 떠오르는 구름[43311]', echoMainStat: '크확 인멸피증/인멸피증 인멸피증/공퍼', critRatio: '크확 70% / 크피 280%', resonanceEfficiency: '130', atk: '1800', energyCost: '125', notes: ['로코코 등과 함께 사용 or 절지 대용으로 사용'] },
  phrolova: { weapon: '잊혀진 피안의 슬픈 악장[전무], 꼭두각시의 손[음림], 파도의 기록, 청음', echoSet: '뒤틀린 피안의 꿈[3세트(크확20%)] 빛을 삼키는 해[2세트] / 어둠의 장막[2세트]', echoMainStat: '크피 인멸피증/인멸피증 인멸피증/공퍼', critRatio: '크확 70% / 크피 265%', resonanceEfficiency: '0', atk: '2500[속공] 2200[속속]', energyCost: '0', notes: ['로코코 칸타렐라와 함께 사용'] },
  chisa: { weapon: '쿠모키리(曇斬)[전무], 불길[루파], 푸른물결의 빛[상시]', echoSet: '운명을 붕괴시키는 현[3세트] 빛을 삼키는 해[2세트] / 어둠의 장막[2세트] / 떠오르는 구름[2세트]', echoMainStat: '크피 인멸피증/인멸피증 공퍼/인멸피증', critRatio: '크확 80% / 크피 260%', resonanceEfficiency: '130', atk: '2300[속공] 2000[속속]', energyCost: '125', notes: ['2세트로 떠오르는 구름을 선택해서 공효 맞추는게 정신 건강에 좋음'] },
  yangyang_xuanling: { weapon: '아득히 푸른 하늘[전무]', echoSet: '내려앉은 깃털의 노래[43311]', echoMainStat: '크피 인멸피증/인멸피증 인멸피증/공퍼', critRatio: '크확 70% / 크피 260%', resonanceEfficiency: '125~130', atk: '2100[속속] 2400[속공]', energyCost: '125', notes: ['대체 무기 효율 아직 미도출'] },
  // 인멸

  // 회절
  rover_spectro: { weapon: '천년의 회류, 솟아오르는 화염, 야귀의 신념', echoSet: '빛나는 별[43311]', echoMainStat: '크확/크피 회절피증/회절피증 회절피증/공퍼', critRatio: '크확 70% / 크피 250%', resonanceEfficiency: '120', atk: '1850', energyCost: '125', notes: ['3체인 이상이면 공효 요구치가 낮아짐'] },
  verina: { weapon: '판타지 변주[4성], 별의 교향곡[파수인], 심해의 메아리[4성]', echoSet: '찬란한 광휘[43311]', echoMainStat: '치료 효과 보너스 공효 공효', critRatio: '-', resonanceEfficiency: '220~', atk: '-', energyCost: '175', notes: ['메인 에코는 돌아갈 곳이 없는 오류 공효만 맞춘다고 생각'] },
  jinhsi: { weapon: '태평성대[전무], 푸른물결의 빛[상시], 가을의 무늬[패스]', echoSet: '빛나는 별[43311][44111]', echoMainStat: '43311:크확/크피 회절피증/회절피증 회절피증/공퍼 | 44111:크확/크피', critRatio: '43311:크확 70% / 크피 270% | 44111:크확 70% / 크피 300%', resonanceEfficiency: '유효옵', atk: '2200[43311], 2100[44111]', energyCost: '150', notes: ['파티원에 협동 공격 캐릭터 추천 ex) 절지, 음림, 연무'] },
  shorekeeper: { weapon: '뭇별의 교향곡[전무], 판타지 변주, 수행자의 증폭기 · 탐색', echoSet: '찬란한 광휘[43311][43111]', echoMainStat: '43311:체퍼/치유보 공효 공효 | 43111:체퍼/치유보 공효', critRatio: '딜 세팅일 경우에만 크피 최대한 챙기기', resonanceEfficiency: '240 / 230[오류_사용시]', hp: '45000', energyCost: '175', notes: ['1코 체퍼 사용'] },
  phoebe: { weapon: '광휘의 찬송가[전무], 꼭두각시의 손[음림], 옥수비단[절지], 바다의 선물', echoSet: '영원의 광채[43311][44111]', echoMainStat: '크피 회절피증/회절피증 회절피증/공퍼', critRatio: '크확 70% / 크피 280%', resonanceEfficiency: '120', atk: '2200[43311]', energyCost: '125', notes: ['메인딜로 기용할시 서포터로 회랑자 채용'] },
  zeni: { weapon: '불빛의 심판[전무], 희비극[로코코], 천상의 나선, 황금 권갑', echoSet: '영원의 광채[34311]', echoMainStat: '크확[2돌크피] 회절피증/회절피증 회절피증/공퍼', critRatio: '크확 70%[50%[2체인]] / 크피 280%[320%[2체인]]', resonanceEfficiency: '125~130', atk: '2100[속속], 2400[속공]', energyCost: '125', notes: ['2돌파 + 필드 편성시 크확 + 20% 페비와 함께 쓰는걸 추천 없다면 아쉬운 대로 회랑자'] },
  lynae: { weapon: '스펙트럼 블래스터[전무], 부동의 안개[상시], 위상의 파동[신규상시]', echoSet: '역광 속 눈부신 서약[43311]', echoMainStat: '크피 회절피증/회절피증 회절피증/공퍼', critRatio: '크확 70% / 크피 260%', resonanceEfficiency: '130~', atk: '2350[속공] 2050[속속]', energyCost: '125', notes: [] },
  luuk_herssen: { weapon: '한낮의 의지[전무], 격동의 조력[신상시], 불빛의 심판[젠니]', echoSet: '흐르는 금빛 속 진리의 답[34311]', echoMainStat: '크피 회절피증/공퍼 회절피증/회절피증', critRatio: '크확 75% / 크피 260%', resonanceEfficiency: '120~125', atk: '2650[속공] 2350[속속]', energyCost: '125', notes: ['메인 에코는 3코 트윈 노바 시리즈 메인에코로 트윈 노바 · 콜라사르 블레이드 장착시 트윈 노바 · 네뷸러스 캐논도 같이 장착해야 회절 피해 보너스로 바뀌니 주의'] },
  lucy: { weapon: '스펙트럴 트리거[전무], 위상의 파동[신상시], 스컬 스래셔[레베카]', echoSet: '꿈을 깨뜨리는 망령의 악몽[1세트(크확15%)] 끊임없는 잔향[2세트] or 마음을 엮은 꿈의 그림자[2세트] / 마음을 엮은 꿈의 그림자[2세트] or 끊임없는 잔향[2세트]', echoMainStat: '크확 회절피증/회절피증 회절피증/공퍼', critRatio: '크확 70% / 크피 270%', resonanceEfficiency: '125~130', atk: '2200[속속] 2500[속공]', energyCost: '125', notes: ['2세트 속공 써도 됨 큰 차이 안 남'] },
  // 회절
}

export function getCharacterRecommendation(characterId) {
  return CHARACTER_RECOMMENDATIONS[characterId] ?? null
}
