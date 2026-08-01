export const ECHO_SET_MAIN_ECHOES = {
  'heart-of-evils-purge': ['myriad-snare-rustfire-chassis', 'forbidden-bastion'],
  'lamp-of-nether-road': ['myriad-snare-rustfire-chassis', 'forbidden-bastion'],
  'song-of-feathered-trace': ['thousand-puppet-pavilion', 'forbidden-bastion'],
  'shadow-of-shattered-dreams': ['reminiscence-nightmare-adam-smasher'],
  'reel-of-spliced-memories': ['nameless-explorer'],
  'wishes-of-quiet-snowfall': ['reminiscence-threnodian-voidborne-construct'],
  'sound-of-true-name': ['nameless-explorer'],
  'chromatic-foam': ['reactor-husk', 'reminiscence-denia'],
  'trailblazing-star': ['z04-sigillum'],
  'rite-of-gilded-revelation': ['hyvatia'],
  'halo-of-starry-radiance': ['reactor-husk'],
  'pact-of-neonlight-leap': ['hyvatia'],

  'thread-of-severed-fate': ['reminiscence-threnodian-leviathan'],
  'flamewings-shadow': ['reminiscence-threnodian-leviathan', 'corrosaurus'],
  'law-of-harmony': ['reminiscence-fenrico'],
  'crown-of-valor': ['the-false-sovereign', 'lady-of-the-sea'],
  'dream-of-the-lost': ['nightmare-hecate', 'reminiscence-fenrico'],
  'flaming-clawprint': ['lioness-of-glory', 'corrosaurus'],
  'windward-pilgrimage': ['reminiscence-fleurdelys', 'nightmare-kelpie'],
  'gusts-of-welkin': ['reminiscence-fleurdelys', 'nightmare-kelpie'],
  'tidebreaking-courage': ['dragon-of-dirge'],
  'empyrean-anthem': ['hecate', 'nightmare-tempest-mephis', 'nightmare-lampylumen-myriad'],
  'midnight-veil': ['lorelei', 'nightmare-impermanence-heron'],
  'eternal-radiance': ['nightmare-mourning-aix', 'capitaneus'],
  'frosty-resolve': ['sentry-construct', 'nightmare-lampylumen-myriad'],

  'lingering-tunes': ['mech-abomination'],
  'moonlit-clouds': ['bell-borne-geochelone', 'impermanence-heron'],
  'rejuvenating-glow': ['bell-borne-geochelone', 'fallacy-of-no-return'],
  'havoc-eclipse': ['crownless', 'dreamless', 'nightmare-crownless'],
  'celestial-light': ['mourning-aix', 'jue'],
  'sierra-gale': ['feilian-beringal', 'nightmare-feilian-beringal'],
  'void-thunder': ['thundering-mephis', 'nightmare-thundering-mephis', 'tempest-mephis', 'nightmare-tempest-mephis'],
  'molten-rift': ['inferno-rider', 'nightmare-inferno-rider'],
  'freezing-frost': ['lampylumen-myriad'],
}

export function getMainEchoIdsForCombo(combo) {
  const ids = []
  const seen = new Set()
  for (const { setId } of combo ?? []) {
    for (const id of ECHO_SET_MAIN_ECHOES[setId] ?? []) {
      if (seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
  }
  return ids
}

export function getMainEchoIdForCombo(combo) {
  return getMainEchoIdsForCombo(combo)[0] ?? null
}
