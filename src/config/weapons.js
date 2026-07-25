/**
 * 무기 카탈로그입니다. atk는 플랫 공격력, subStat은 무기의 부스탯(% 카테고리에 더해짐),
 * bonuses는 무기 패시브로 항상 붙는 % 보너스입니다. category 이름은 StatsPage의 합산 스탯
 * 카테고리 이름과 정확히 같아야 합니다.
 *
 * 아이콘은 항상 /weapons/{id}.png 경로라 따로 안 받고 id로 자동 생성합니다 — public/weapons/에
 * 그 파일명으로 이미지를 넣어두면 자동으로 연결됩니다.
 *
 * 이름만 채워지고 나머지가 비어있는(weapon-01 등) 항목은 이름만 확정된 자리표시자입니다 — 실제
 * 타입/공격력/부스탯/패시브 데이터를 알려주시면 채워서 바로 동작하게 만들 수 있어요. id도
 * weapon-N은 임시 키라, 실제 데이터를 넣을 때 알아보기 쉬운 슬러그로 같이 바꿔주세요.
 */

/**
 * @param {string} id 카탈로그 키(아이콘 파일명으로도 그대로 씀: /weapons/{id}.png)
 * @param {string} name 표시 이름
 * @param {string} type 무기 타입(직검/장검/거너/법기/... )
 * @param {number} atk 플랫 공격력
 * @param {string|null} subStatCategory 무기 부스탯 카테고리(없으면 null)
 * @param {number|null} subStatValue 무기 부스탯 값(%). subStatCategory가 null이면 무시됨.
 * @param {string|null} passiveName 패시브 이름(없으면 null)
 * @param {[string, number][]} bonuses 항상 붙는 % 보너스 [카테고리, 값] 목록(없으면 빈 배열)
 * @param {string} description 패시브 설명
 * @param {string} [note] 계산에 반영하지 않는 부분에 대한 안내 문구(선택)
 */
function defineWeapon(id, name, type, atk, subStatCategory, subStatValue, passiveName, bonuses, description, note) {
  return [
    id,
    {
      name,
      type,
      icon: `/weapons/${id}.png`,
      atk,
      ...(subStatCategory ? { subStat: { category: subStatCategory, value: subStatValue } } : {}),
      bonuses: bonuses.map(([category, value]) => ({ category, value })),
      ...(passiveName ? { passiveName } : {}),
      description,
      ...(note ? { note } : {}),
    },
  ]
}

export const WEAPONS = Object.fromEntries([
  defineWeapon('weapon-01', '청룡의 천장', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-02', '푸른물결의 빛', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-03', '가을의 무늬', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-04', '숲속의 아리아', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-05', '부동의 안개', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-06', '화려한 악곡', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-07', '숙명에 맞서는 관', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-08', '날카로운 봄', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-09', '혈맹의 약속', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-10', '천년의 회류', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-11', '행진의 서곡', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-12', '세상 만물의 진리', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-13', '팔방의 천추', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-14', '불빛의 심판', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-15', '물결의 파동', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-16', '푸른 의지', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-17', '솟아오르는 화염', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-18', '솔스원의 해석', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-19', '한낮의 의지', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-20', '꼭두각시의 손', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-21', '옥수 비단', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-22', '파도의 기록', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-23', '청음', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-24', '야귀의 신념', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-25', '흔들리지 않는 용기', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-26', '불길', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-27', '태평성대', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-28', '얽혀진 빛과 그림자', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-29', '죽음과 춤', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-30', '별하늘 연산 측정기', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-31', '기묘한 울림', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-32', '날카로움 봄', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-33', '위조된 작은별', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-34', '잊혀진 피안의 슬픈 악장', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-35', '죽음의 춤', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-36', '뇌전', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-37', '천상의 나선', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-38', '서린 불꽃', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-39', '프리즈 프레임', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-40', '푸른 물결의 빛', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-41', '황금 권갑', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-42', '천둥벼락을 다스리는 권능', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-43', '스컬 스래셔', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-44', '위상의 파동', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-45', '희비극', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-46', '바다의 속삭임', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-47', '쿠모키리(曇斬)', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-48', '아득히 푸른 하늘', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-49', '판타지 변주', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-50', '별의 교향곡', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-51', '심해의 메아리', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-52', '뭇별의 교향곡', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-53', '수행자의 증폭기 · 탐색', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-54', '광휘의 찬송가', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-55', '옥수비단', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-56', '바다의 선물', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-57', '스펙트럼 블래스터', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-58', '격동의 조력', '', 0, null, null, null, [], ''),
  defineWeapon('weapon-59', '스펙트럴 트리거', '', 0, null, null, null, [], ''),

  defineWeapon(
    'eternal-radiance', '영원한 샛별', '직검', 587,
    '크리티컬', 24.3,
    '별을 좇아서',
    [['속성 피해 보너스', 12]],
    '전체 속성 피해 보너스가 12% 증가된다. 조화 파동·이탈 혹은 불꽃 효과 추가 시, 공명 해방 ' +
      '피해는 목표의 32% 방어력과 10%의 용융 저항을 무시하고, 8초간 지속된다.',
    '방어력·저항 무시 효과는 계산에 반영하지 않고 안내 문구로만 보여드립니다. 실제 적용되는 수치는 속성 피해 보너스 12%뿐입니다.',
  ),
])

export function getWeapon(weaponId) {
  return WEAPONS[weaponId] ?? null
}
