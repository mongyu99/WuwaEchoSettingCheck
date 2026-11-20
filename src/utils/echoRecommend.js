import { CHARACTERS } from '../config/characters'
import { getValidOptions } from '../config/characterValidOptions'
import { getCharacterEchoCombos } from '../config/characterEchoSets'
import { scoreValidStats } from './echoScore'

export const usesSet = (characterId, setId) =>
  !!setId && (getCharacterEchoCombos(characterId) ?? []).some((combo) => combo.some((part) => part.setId === setId))

/** 이 메인 옵션이 캐릭터에게 쓸모 있는지: 속성 피해는 같은 속성만, 나머지는 유효 옵션 목록에 있어야 합니다. */
export function mainFits(character, mainLabel) {
  if (!mainLabel) return false
  if (mainLabel.endsWith(' 피해 보너스')) return character.element === mainLabel.replace(' 피해 보너스', '')
  const valid = getValidOptions(character.id)
  return valid.includes(`${mainLabel}%`) || valid.includes(mainLabel)
}

/** 세트가 맞는 캐릭터를 먼저, 그다음 메인 옵션이 유효한 캐릭터, 그 안에서는 유효 점수가 높은 순으로 보여줍니다. */
export function recommend(subStats, setId, mainLabel, count = 5) {
  // 속성 피해 메인은 같은 속성 캐릭터에게만 쓸모가 있습니다.
  const mainElement = mainLabel?.endsWith(' 피해 보너스') ? mainLabel.replace(' 피해 보너스', '') : null
  return CHARACTERS.filter((c) => !c.upcoming && (!mainElement || c.element === mainElement))
    .map((character) => ({
      character,
      setMatched: usesSet(character.id, setId),
      mainMatched: !!mainLabel && getValidOptions(character.id).includes(`${mainLabel}%`),
      ...scoreValidStats(subStats, getValidOptions(character.id)),
    }))
    .sort((a, b) => b.setMatched - a.setMatched || b.mainMatched - a.mainMatched || b.total - a.total)
    .slice(0, count)
}
