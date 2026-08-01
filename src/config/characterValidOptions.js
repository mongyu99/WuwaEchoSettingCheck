/**
 * 캐릭터별로 점수 계산에 반영할 "유효 옵션" 서브스탯 목록입니다.
 * 여기 이름이 없는 스탯은 해당 캐릭터 기준으로는 점수에 포함되지 않습니다.
 * (스탯명은 src/config/subStatOptions.js의 SUB_STAT_NAMES와 정확히 같은 문자열이어야 합니다.)
 */
const DEFAULT_ATK_OPTIONS = ["크리티컬%", "크리티컬 피해%", "공격력%", "공명 효율%", "공격력"];
const DEFAULT_DEF_OPTIONS = ["크리티컬%", "크리티컬 피해%", "방어력%", "공명 효율%", "방어력"];
const DEFAULT_HP_OPTIONS = ["크리티컬%", "크리티컬 피해%", "HP%", "공명 효율%", "HP"];

export const CHARACTER_VALID_OPTIONS = {
  "aemeath": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],

  "lingyang": [...DEFAULT_ATK_OPTIONS],
  "zhezhi": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "carlotta": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "lucilla": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "hiyuki": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "suisui": ["크리티컬%", "크리티컬 피해%", "HP%", "공명 효율%"],
  "encore": [...DEFAULT_ATK_OPTIONS],
  "changli": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "brant": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "lupa": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "galbrena": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "mornye": ["크리티컬%", "크리티컬 피해%", "방어력%", "공명 해방 피해 보너스%", "공명 효율%"],

  "denia": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "calcharo": [...DEFAULT_ATK_OPTIONS],
  "yinlin": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "xiangli_yao": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "augusta": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "rebecca": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "rover_electro": [...DEFAULT_ATK_OPTIONS],
  "jiyan": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "감심": [...DEFAULT_ATK_OPTIONS],
  "ciaccona": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "rover_aero": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "cartethyia": ["크리티컬%", "크리티컬 피해%", "HP%", "일반 공격 피해 보너스%", "공명 효율%"],
  "iuno": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "qiuyuan": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "sigrika": [...DEFAULT_ATK_OPTIONS],
  "verina": [...DEFAULT_ATK_OPTIONS],
  "rover_spectro": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "jinhsi": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "shorekeeper": ["크리티컬%", "크리티컬 피해%", "HP%", "공명 효율%"],
  "phoebe": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "zeni": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "lynae": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "luuk_herssen": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "lucy": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "camellya": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "rover_havoc": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "roccia": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
  "cantarella": [...DEFAULT_ATK_OPTIONS, "일반 공격 피해 보너스%"],
  "phrolova": [...DEFAULT_ATK_OPTIONS, "공명 스킬 피해 보너스%"],
  "chisa": [...DEFAULT_ATK_OPTIONS, "공명 해방 피해 보너스%"],
  "Yangyang_Xuanling": [...DEFAULT_ATK_OPTIONS, "강공격 피해 보너스%"],
}

// 목록에 없는 캐릭터(신규 캐릭터 추가 직후 등)는 크리티컬%·크리티컬 피해%·공격력%·공명 효율%·
// 공격력(DEFAULT_ATK_OPTIONS)을 기본값으로 씁니다 — 대부분의 딜러가 공격력 스케일링이라 가장
// 무난한 기본값입니다. 실제 세팅을 알려주시면 그 캐릭터 전용 값으로 맞춰드릴게요.
export function getValidOptions(characterId) {
  return CHARACTER_VALID_OPTIONS[characterId] ?? DEFAULT_ATK_OPTIONS
}
