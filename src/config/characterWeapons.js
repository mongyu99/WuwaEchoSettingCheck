/**
 * 캐릭터별로 실제 사용 가능한 무기를 구체적인 목록으로 제한합니다. 여기 등록된 캐릭터는 목록에
 * 있는 무기만 고를 수 있고, 등록되지 않은 캐릭터는 기존처럼 무기 타입(config/characters.js의
 * weaponType, 예: 직검/대검/권총/권갑/증폭기) 기준으로만 넓게 제한됩니다.
 */

/**
 * @param {string} characterId 캐릭터 id(config/characters.js의 CHARACTERS 항목 id와 같아야 함)
 * @param {...string} weaponIds 이 캐릭터가 쓸 수 있는 무기 id 목록(config/weapons.js의 WEAPONS 키들)
 */
function defineCharacterWeapons(characterId, ...weaponIds) {
  return [characterId, weaponIds]
}

export const CHARACTER_WEAPONS = Object.fromEntries([
  // 기류
  defineCharacterWeapons('jiyan', 'verdant-summit', 'lustrous-razor', 'autumntrace'),
  defineCharacterWeapons('ciaccona', 'woodland-aria', 'static-mist', 'cadenza'),
  defineCharacterWeapons('cartethyia', 'defiers-thorn', 'red-spring'),
  defineCharacterWeapons('rover_aero', 'bloodpacts-pledge', 'emerald-of-genesis', 'overture'),
  defineCharacterWeapons('iuno', 'moongazers-sigil', 'veritys-handle', 'blazing-justice', 'abyss-surges'),
  defineCharacterWeapons('qiuyuan', 'emerald-sentence', 'red-spring', 'blazing-brilliance', 'emerald-of-genesis'),
  defineCharacterWeapons('sigrika', 'solsworn-ciphers', 'blazing-justice', 'daybreakers-spine'),
  // 기류

  // 용융
  defineCharacterWeapons('encore', 'stringmaster', 'rime-draped-sprouts', 'cosmic-ripples', 'augment'),
  defineCharacterWeapons('changli', 'blazing-brilliance', 'emerald-of-genesis', 'commando-of-conviction'),
  defineCharacterWeapons('brant', 'unflickering-valor', 'red-spring', 'emerald-of-genesis', 'overture'),
  defineCharacterWeapons('lupa', 'wildfire-mark', 'ages-of-harvest', 'verdant-summit', 'lustrous-razor'),
  defineCharacterWeapons('galbrena', 'lux-umbra', 'the-last-dance', 'static-mist', 'woodland-aria'),
  defineCharacterWeapons('mornye', 'starfield-calibrator', 'discord'),
  defineCharacterWeapons('aemeath', 'eternal-radiance', 'emerald-of-genesis', 'red-spring', 'emerald-sentence'),
  defineCharacterWeapons('denia', 'forged-dwarf-star', 'stringmaster', 'lethean-elegy'),
  // 용융

  // 응결
  defineCharacterWeapons('zhezhi', 'rime-draped-sprouts', 'stringmaster', 'cosmic-ripples', 'augment'),
  defineCharacterWeapons('carlotta', 'the-last-dance', 'static-mist', 'thunderbolt'),
  defineCharacterWeapons('lingyang', 'blazing-justice', 'veritys-handle', 'abyss-surges', 'celestial-spiral'),
  defineCharacterWeapons('hiyuki', 'frostburn', 'emerald-of-genesis', 'blazing-brilliance'),
  defineCharacterWeapons('lucilla', 'freeze-frame', 'stringmaster', 'rime-draped-sprouts'),
  defineCharacterWeapons('suisui', 'variation', 'firstlights-herald'),
  // 응결

  // 전도
  defineCharacterWeapons('yinlin', 'stringmaster', 'rime-draped-sprouts', 'cosmic-ripples', 'augment'),
  defineCharacterWeapons('calcharo', 'ages-of-harvest', 'verdant-summit', 'lustrous-razor', 'autumntrace'),
  defineCharacterWeapons('xiangli_yao', 'veritys-handle', 'abyss-surges', 'stonard'),
  defineCharacterWeapons('augusta', 'thunderflare-dominion', 'verdant-summit', 'ages-of-harvest', 'lustrous-razor'),
  defineCharacterWeapons('rebecca', 'skull-thrasher', 'static-mist', 'phasic-homogenizer'),
  // 전도

  // 인멸
  defineCharacterWeapons('rover_havoc', 'emerald-of-genesis', 'blazing-brilliance', 'commando-of-conviction'),
  defineCharacterWeapons('camellya', 'red-spring', 'emerald-of-genesis', 'commando-of-conviction'),
  defineCharacterWeapons('roccia', 'tragicomedy', 'veritys-handle', 'abyss-surges', 'stonard'),
  defineCharacterWeapons('cantarella', 'whispers-of-sirens', 'stringmaster', 'cosmic-ripples', 'augment'),
  defineCharacterWeapons('phrolova', 'lethean-elegy', 'stringmaster', 'cosmic-ripples', 'augment'),
  defineCharacterWeapons('chisa', 'kumokiri', 'wildfire-mark', 'lustrous-razor'),
  defineCharacterWeapons('yangyang_xuanling', 'azure-oath'),
  // 인멸

  // 회절
  defineCharacterWeapons('rover_spectro', 'emerald-of-genesis', 'blazing-brilliance', 'commando-of-conviction'),
  defineCharacterWeapons('verina', 'variation', 'call-of-the-abyss', 'stellar-symphony'),
  defineCharacterWeapons('jinhsi', 'ages-of-harvest', 'lustrous-razor', 'autumntrace'),
  defineCharacterWeapons('shorekeeper', 'stellar-symphony', 'variation', 'rectifier-of-voyager'),
  defineCharacterWeapons('phoebe', 'luminous-hymn', 'stringmaster', 'rime-draped-sprouts', 'oceans-gift'),
  defineCharacterWeapons('zeni', 'blazing-justice', 'tragicomedy', 'celestial-spiral', 'stonard'),
  defineCharacterWeapons('lynae', 'spectrum-blaster', 'static-mist', 'phasic-homogenizer'),
  defineCharacterWeapons('luuk_herssen', 'daybreakers-spine', 'pulsation-bracer', 'blazing-justice'),
  defineCharacterWeapons('lucy', 'spectral-trigger', 'phasic-homogenizer', 'skull-thrasher'),
  // 회절
])

/** 이 캐릭터가 쓸 수 있는 무기 id 목록을 반환합니다(등록 안 됐으면 null — weaponType 기준으로 대체). */
export function getCharacterWeaponIds(characterId) {
  return CHARACTER_WEAPONS[characterId] ?? null
}
