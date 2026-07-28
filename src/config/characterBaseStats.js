const BASE_ENERGY_REGEN = 100.0
const BASE_CRIT_RATE = 5.0
const BASE_CRIT_DMG = 150.0

/**
 * @param {string} id 캐릭터 id(config/characters.js의 CHARACTERS 항목 id와 같아야 함)
 * @param {number} hp 기초 HP
 * @param {number} atk 기초 공격력
 * @param {number} def 기초 방어력
 * @param {[string, number][]} innateBonuses 캐릭터 고유 특성으로 항상 붙는 % 보너스
 */
function defineCharacterBaseStats(id, hp, atk, def, innateBonuses) {
  return [
    id,
    {
      hp,
      atk,
      def,
      energyRegen: BASE_ENERGY_REGEN,
      critRate: BASE_CRIT_RATE,
      critDmg: BASE_CRIT_DMG,
      innateBonuses: innateBonuses.map(([category, value]) => ({ category, value })),
    },
  ]
}

export const CHARACTER_BASE_STATS = Object.fromEntries([
  // Hp, 공격력, 방어력 순이며 노드는 뒤에 붙입니다
  // 기류
  defineCharacterBaseStats('jiyan', 10487, 425, 1148, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('ciaccona', 12237, 375, 1197, [['크리티컬 피해', 16.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('cartethyia', 14800, 312, 611, [['크리티컬', 8.0], ['HP', 12.0],]),
  defineCharacterBaseStats('rover_aero', 10775, 437, 1136, [['치료 효과 보너스', 12.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('iuno', 10525, 450, 1124, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('qiuyuan', 12237, 375, 1197, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('sigrika', 10775, 437, 1136, [['크리티컬', 8.0], ['공격력', 12.0],]),
  // 기류
  
  // 용융
  defineCharacterBaseStats('encore', 10512, 425, 1246, [['용융 피해 보너스', 12.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('changli', 10387, 462, 1099, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('brant', 11675, 375, 1307, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('lupa', 11912, 387, 1185, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('galbrena', 10300, 462, 1112, [['크리티컬 피해', 16.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('mornye', 15375, 287, 1356, [['치료 효과 보너스', 12.0], ['방어력', 15.2],]),
  defineCharacterBaseStats('aemeath', 11025, 425, 1148, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('denia', 11025, 425, 1148, [['크리티컬 피해', 16.0], ['공격력', 12.0],]),
  // 용융

  // 응결
  defineCharacterBaseStats('zhezhi', 12250, 375, 1197, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('carlotta', 12450, 462, 1197, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('lingyang', 12450, 462, 1197, [['응결 피해 보너스', 12.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('hiyuki', 10300, 462, 1112, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('lucilla', 12237, 375, 1197, [['크리티컬', 8.0], ['공격력', 12.0],]),
  // 수수 픽업 완료 후 수정 필요 - 26.7.28 TOBE
  defineCharacterBaseStats('suisui', 12237, 375, 1197, [['크리티컬', 0], ['공격력', 0],]),
  // 응결

  // 전도
  defineCharacterBaseStats('yinlin', 11000, 400, 1283, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('calcharo', 11000, 400, 1283, [['크리티컬 피해', 16.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('xiangli_yao', 10625, 425, 1222, [['크리티컬 피해', 16.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('augusta', 10300, 462, 1112, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('rebecca', 11600, 400, 1173, [['크리티컬', 8.0], ['공격력', 12.0],]),

  defineCharacterBaseStats('rover_electro', 10775, 437, 1136, [['크리티컬', 23.0], ['속성 피해 보너스', 10.0],]),
  // 전도

  // 인멸
  defineCharacterBaseStats('rover_havoc', 10825, 412, 1258, [['속성 피해 보너스', 22.0],]),

  defineCharacterBaseStats('camellya', 10325, 450, 1161, [['크리티컬 피해', 16.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('roccia', 12250, 375, 1197, [['크리티컬 피해', 16.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('cantarella', 11600, 400, 1099, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('phrolova', 10775, 437, 1136, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('chisa', 10775, 437, 1136, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('yangyang_xuanling', 11025, 425, 1148, [['크리티컬', 8.0], ['공격력', 12.0],]),
  // 인멸

  // 회절
  defineCharacterBaseStats('rover_spectro', 11400, 375, 1368, [['공명 효율', 10.0], ['속성 피해 보너스', 12.0],]),

  defineCharacterBaseStats('verina', 14237, 337, 1099, [['치료 효과 보너스', 12.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('jinhsi', 10825, 412, 1258, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('shorekeeper', 16712, 287, 1099, [['치료 효과 보너스', 12.0], ['HP', 12.0],]),
  defineCharacterBaseStats('phoebe', 10825, 412, 1258, [['크리티컬 피해', 16.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('zeni', 10775, 437, 1136, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('lynae', 12237, 375, 1197, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('luuk_herssen', 10300, 462, 1112, [['크리티컬', 8.0], ['공격력', 12.0],]),
  defineCharacterBaseStats('lucy', 11025, 425, 1148, [['크리티컬', 8.0], ['공격력', 12.0],]),
  // 회절
])

export function getCharacterBaseStats(characterId) {
  return CHARACTER_BASE_STATS[characterId] ?? null
}
