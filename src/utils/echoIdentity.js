// 같은 에코인지 짐작하기: 코스트 · 메인 옵션 · 서브 옵션(이름과 수치)이 전부 같으면 같은 에코일 가능성이 매우 높습니다.
// 다른 에코가 우연히 다 같을 수도 있어서(아주 드묾) 막지는 않고, 화면에서 "같은 에코 같아요"라고 알려 주는 데만 씁니다.
import { getEchoCost } from './ocr'

const subKey = (subStats) =>
  (subStats ?? [])
    .filter((s) => s?.label && s?.valueText)
    .map((s) => `${s.label}=${parseFloat(s.valueText)}`)
    .sort()
    .join('|')

/** target: { cost, mainLabel, subStats } · saved: 저장된 에코. */
export function looksSameEcho(target, saved) {
  if (!target?.subStats?.length || !saved) return false
  const savedCost = Number(getEchoCost(saved))
  if (target.cost && savedCost && Number(target.cost) !== savedCost) return false
  const savedMain = saved.mainStats?.[0]?.label
  if (target.mainLabel && savedMain && target.mainLabel !== savedMain) return false
  return subKey(target.subStats) === subKey(saved.subStats)
}

/** 저장된 에코 목록에서 같은 에코로 보이는 자리(없으면 -1). */
export const findSameEcho = (target, echoes) => (echoes ?? []).findIndex((e) => looksSameEcho(target, e))
