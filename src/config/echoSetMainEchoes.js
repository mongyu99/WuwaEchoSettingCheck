/**
 * 에코 세트 ↔ 메인 에코 연결을 전담하는 파일입니다. "사용 에코 세트"만 고르면 메인 에코는 여기
 * 등록된 연결을 따라 자동으로 정해집니다(수동 선택 없음).
 *
 * 에코 세트를 기준으로 등록합니다(사용자가 실제로 고르는 게 에코 세트라 조회 방향과 맞고, 조회도
 * 배열 탐색 없이 바로 찾아집니다). 세트 하나에 호환되는 메인 에코가 여러 개인 경우가 있어서(예:
 * molten-rift는 inferno-rider·nightmare-inferno-rider 둘 다와 호환) 값은 항상 배열이고, 자동
 * 적용은 배열의 첫 번째 메인 에코를 씁니다.
 *
 * key: 에코 세트 id(config/echoSets.js의 ECHO_SETS 키)
 * value: 호환되는 메인 에코 id 배열(config/mainEchoes.js의 MAIN_ECHOES 키들, 1개 이상)
 */
export const ECHO_SET_MAIN_ECHOES = {
  /* 3.x 버전 */
  'heart-of-evils-purge': ['myriad-snare-rustfire-chassis'],
  'lamp-of-nether-road': ['myriad-snare-rustfire-chassis'],
  'song-of-feathered-trace': ['thousand-puppet-pavilion'],
  'shadow-of-shattered-dreams': ['reminiscence-nightmare-adam-smasher'],
  'reel-of-spliced-memories': ['nameless-explorer'],
  'wishes-of-quiet-snowfall': ['reminiscence-threnodian-voidborne-construct'],
  'sound-of-true-name': ['nameless-explorer'],
  'chromatic-foam': ['reactor-husk', 'reminiscence-denia'],
  'trailblazing-star': ['z04-sigillum'],
  'rite-of-gilded-revelation': ['hyvatia'],
  'halo-of-starry-radiance': ['reactor-husk'],
  'pact-of-neonlight-leap': ['hyvatia'],
  /* 3.x 버전 */

  /* 2.x 버전 */
  'thread-of-severed-fate': ['reminiscence-threnodian-leviathan'],
  'flamewings-shadow': ['reminiscence-threnodian-leviathan', 'kerasaur'],
  'law-of-harmony': ['reminiscence-fenrico'],
  'crown-of-valor': ['the-false-sovereign', 'lady-of-the-sea'],
  'dream-of-the-lost': ['nightmare-hecate', 'reminiscence-fenrico'],
  'flaming-clawprint': ['lioness-of-glory'],
  'windward-pilgrimage': ['reminiscence-fleurdelys', 'nightmare-kelpie'],
  'gusts-of-welkin': ['reminiscence-fleurdelys', 'nightmare-kelpie'],
  'tidebreaking-courage': ['dragon-of-dirge'],
  'empyrean-anthem': ['hecate', 'nightmare-tempest-mephis', 'nightmare-lampylumen-myriad'],
  'midnight-veil': ['lorelei', 'nightmare-impermanence-heron'],
  'eternal-radiance': ['nightmare-mourning-aix'],
  'frosty-resolve': ['sentry-construct', 'nightmare-lampylumen-myriad'],
  /* 2.x 버전 */

  /* 1.x 버전 */
  'lingering-tunes': ['mech-abomination'],
  'moonlit-clouds': ['bell-borne-geochelone', 'impermanence-heron'],
  'rejuvenating-glow': ['bell-borne-geochelone', 'fallacy-of-no-return'],
  'havoc-eclipse': ['crownless', 'dreamless', 'nightmare-crownless'],
  'celestial-light': ['mourning-aix', 'jue'],
  'sierra-gale': ['feilian-beringal', 'nightmare-feilian-beringal'],
  'void-thunder': ['thundering-mephis', 'nightmare-thundering-mephis', 'tempest-mephis', 'nightmare-tempest-mephis'],
  'molten-rift': ['inferno-rider', 'nightmare-inferno-rider'],
  'freezing-frost': ['lampylumen-myriad'],
  /* 1.x 버전 */
}

/**
 * 이 에코 세트에 연결된 메인 에코 id를 반환합니다(호환 후보가 여럿이면 첫 번째, 없으면 null).
 * 파일 밖에서 쓰는 곳이 없어 export하지 않습니다 — getMainEchoIdForCombo 내부에서만 씁니다.
 */
function getMainEchoIdForSet(echoSetId) {
  if (!echoSetId) return null
  return ECHO_SET_MAIN_ECHOES[echoSetId]?.[0] ?? null
}

/**
 * 조합([{ setId, pieceCount }, ...]) 안의 세트들을 순서대로 훑어서, 메인 에코가 연결된 첫 세트의
 * 메인 에코 id를 반환합니다(없으면 null). 조합 하나에 메인 에코가 연결된 세트는 보통 하나뿐이라
 * "제일 많이 착용한 세트를 우선한다" 같은 규칙 없이 먼저 찾은 것을 그대로 씁니다.
 */
export function getMainEchoIdForCombo(combo) {
  for (const { setId } of combo ?? []) {
    const mainEchoId = getMainEchoIdForSet(setId)
    if (mainEchoId) return mainEchoId
  }
  return null
}
