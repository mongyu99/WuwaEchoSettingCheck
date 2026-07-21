/**
 * 캐릭터별로 점수 계산에 반영할 "유효 옵션" 서브스탯 목록입니다.
 * 여기 이름이 없는 서브스탯은 해당 캐릭터 기준으로는 점수에 포함되지 않습니다.
 * (스탯명은 src/config/subStatOptions.js의 SUB_STAT_NAMES와 정확히 같은 문자열이어야 합니다.)
 *
 * '명조 스펙 계산기' 엑셀의 '공명자 정보' 시트(주스탯/피해 유형)를 기준으로 자동 생성했습니다:
 * 크리티컬% · 크리티컬 피해% · 주스탯%(공격력%/방어력%/HP%) · 해당 캐릭터의 피해 유형에 맞는
 * 보너스% · 공명 효율%(현재 점수에는 반영 안 되지만 참고용으로 포함). 시트에 정보가 없던
 * 캐릭터(4성 전체, 능양/앙코/카카루/감심/방랑자·전도)는 크리티컬%·크리티컬 피해%·공격력%·
 * 공명 효율%로 기본값을 넣어뒀습니다 — 실제 세팅을 알려주시면 정확히 맞춰드릴게요.
 */
const DEFAULT_ATK_OPTIONS = ["크리티컬%", "크리티컬 피해%", "공격력%", "공명 효율%", "공격력"];
const DEFAULT_DEF_OPTIONS = ["크리티컬%", "크리티컬 피해%", "방어력%", "공명 효율%", "방어력"];
const DEFAULT_HP_OPTIONS = ["크리티컬%", "크리티컬 피해%", "HP%", "공명 효율%", "HP"];

export const CHARACTER_VALID_OPTIONS = {
  "aemeath": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],

  "능양": [...DEFAULT_ATK_OPTIONS],
  "절지": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "카를로타": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "루실라": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "히유키": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "수수": ["크리티컬%", "크리티컬 피해%", "HP%", "공명 효율%"],
  "앙코": [...DEFAULT_ATK_OPTIONS],
  "장리": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "브렌트": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "루파": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "갈브레나": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "모니에": ["크리티컬%", "크리티컬 피해%", "방어력%", "공명 해방 피해 보너스%", "공명 효율%"],

  "denia": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "카카루": [...DEFAULT_ATK_OPTIONS],
  "음림": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "상리요": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "아우구스타": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "레베카": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "방랑자·전도": [...DEFAULT_ATK_OPTIONS],
  "기염": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "감심": [...DEFAULT_ATK_OPTIONS],
  "샤콘": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "방랑자·기류": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "카르티시아": ["크리티컬%", "크리티컬 피해%", "HP%", "일반 공격 피해 보너스%", "공명 효율%"],
  "유노": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "구원": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "시그리카": [...DEFAULT_ATK_OPTIONS],
  "벨리나": [...DEFAULT_ATK_OPTIONS],
  "방랑자·회절": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "금희": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "파수인": ["크리티컬%", "크리티컬 피해%", "HP%", "공명 효율%"],
  "페비": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "젠니": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "린네": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "루크·헤르센": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "루시": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "카멜리아": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "방랑자·인멸": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "로코코": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "칸타렐라": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "플로로": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "치사": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "yangyang": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
}

// 목록에 없는 캐릭터(신규 캐릭터 추가 직후 등)는 크리티컬%·크리티컬 피해%·공격력%·공명 효율%·
// 공격력(DEFAULT_ATK_OPTIONS)을 기본값으로 씁니다 — 대부분의 딜러가 공격력 스케일링이라 가장
// 무난한 기본값입니다. 실제 세팅을 알려주시면 그 캐릭터 전용 값으로 맞춰드릴게요.
export function getValidOptions(characterId) {
  return CHARACTER_VALID_OPTIONS[characterId] ?? DEFAULT_ATK_OPTIONS
}
