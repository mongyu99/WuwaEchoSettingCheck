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
 * 조합([{ setId, pieceCount }, ...]) 안의 세트들을 순서대로 훑어서, 메인 에코가 연결된 첫 세트의
 * 호환 메인 에코 id 배열을 그대로 반환합니다(없으면 빈 배열). 배열에 2개 이상 들어있으면
 * StatsPage에서 교체 아이콘으로 그중 하나를 골라 쓸 수 있습니다.
 */
export function getMainEchoIdsForCombo(combo) {
  for (const { setId } of combo ?? []) {
    const ids = ECHO_SET_MAIN_ECHOES[setId]
    if (ids?.length) return ids
  }
  return []
}

/** 메인 에코 id를 반환합니다(호환 후보가 여럿이면 첫 번째, 없으면 null). */
export function getMainEchoIdForCombo(combo) {
  return getMainEchoIdsForCombo(combo)[0] ?? null
}
