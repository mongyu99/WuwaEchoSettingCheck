// 에코 가방 정리: 인식한 에코를 중복 없이 모으고, 에코마다 가장 잘 맞는 캐릭터와 점수를 매깁니다.
import { recommend } from './echoRecommend'
import { costOfMain } from './echoRecognition'

/**
 * 같은 에코인지 판단하는 키입니다. 이미지 해시는 커서·선택 테두리 때문에 매번 달라져서, 읽은 결과로 비교합니다.
 * 세트 + 코스트 + 메인 옵션 + 서브 옵션(순서대로)이 모두 같으면 같은 에코로 봅니다.
 */
export function echoKey({ name, setId, main, subStats }) {
  const subs = subStats.map((s) => `${s.label}=${s.valueText}`).join(',')
  return [name ?? '-', setId ?? '-', costOfMain(main) ?? '-', main ? `${main.label}=${main.valueText}` : '-', subs].join('|')
}

/** 인식 결과 하나를 가방 항목으로 만듭니다. 서브 옵션이 없으면 에코 화면이 아니라서 null입니다. */
export function toBagItem(recognized, now = Date.now()) {
  if (!recognized?.subStats?.length) return null
  const { name = null, setId = null, main = null, subStats, thumbnail = null } = recognized
  return {
    key: echoKey({ name, setId, main, subStats }),
    name,
    setId,
    main,
    cost: costOfMain(main),
    subStats: subStats.map(({ label, valueText }) => ({ label, valueText })),
    thumbnail,
    capturedAt: now,
  }
}

/** 에코 하나를 평가합니다. 가장 잘 맞는 캐릭터와 그 캐릭터 기준 유효 점수를 붙입니다. */
export function evaluateBagItem(item) {
  const [best] = recommend(item.subStats, item.setId, item.main?.label, 1)
  const score = best?.total ?? 0
  return {
    ...item,
    bestCharacter: best?.character ?? null,
    score,
    validCount: best?.validCount ?? 0,
    // 추천 캐릭터 기준 유효 옵션 줄(이름·수치·점수)입니다.
    validRows: best?.rows ?? [],
  }
}

/** 점수가 높은 순으로 정렬합니다. */
export const sortByScore = (items) => [...items].sort((a, b) => b.score - a.score)

/** 이 에코의 해당 서브 옵션 수치입니다. 없으면 null. */
export function subValue(item, label) {
  const stat = item.subStats.find((s) => s.label === label)
  return stat ? parseFloat(stat.valueText) : null
}

/**
 * 고른 서브 옵션을 모두 가진 에코만 남기고 정렬합니다.
 * sortKey: 'recent'(기본, 최근 등록 순) / 'score'(점수 순) / 서브 옵션 이름(그 옵션 수치 순, 같으면 점수 순)
 */
export function filterAndSort(items, { required = [], sortKey = 'recent' } = {}) {
  const kept = items.filter((item) => required.every((label) => subValue(item, label) !== null))
  if (sortKey === 'recent') return [...kept].sort((a, b) => (b.capturedAt ?? 0) - (a.capturedAt ?? 0))
  if (sortKey === 'score') return sortByScore(kept)
  return [...kept].sort((a, b) => (subValue(b, sortKey) ?? -1) - (subValue(a, sortKey) ?? -1) || b.score - a.score)
}
