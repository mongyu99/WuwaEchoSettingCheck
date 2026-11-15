// 무기 돌파 단계(1~5)에 따라 달라지는 수치를 적용합니다.
// 무기 설명에 이미 "12%/15%/18%/21%/24%"처럼 5단계 값이 적혀 있으므로, 이런 묶음을 앞에서부터 찾아
// 고른 돌파 단계의 값만 남깁니다. 따로 수치표를 입력할 필요가 없습니다.
export const WEAPON_RANKS = [1, 2, 3, 4, 5]

// 숫자(소수 가능) + 선택적 % 가 "/"로 5개 이어진 묶음입니다.
const RANK_GROUP = /\d+(?:\.\d+)?%?(?:\/\d+(?:\.\d+)?%?){4}/g

const clampRank = (rank) => Math.min(5, Math.max(1, Number(rank) || 1))

/** 설명에 있는 돌파 단계 묶음들입니다. 예: [["12%","15%","18%","21%","24%"], ...] */
export function rankGroups(description) {
  return (description?.match(RANK_GROUP) ?? []).map((group) => group.split('/'))
}

/** 설명의 5단계 묶음을 고른 돌파 단계의 값으로 바꿉니다. 예: 3돌파면 "12%/15%/18%/21%/24%" → "18%" */
export function weaponDescriptionAt(weapon, rank) {
  const r = clampRank(rank)
  return (weapon?.description ?? '').replace(RANK_GROUP, (group) => group.split('/')[r - 1])
}

/**
 * 계산에 쓸 무기 보너스입니다. rankRef(설명에서 몇 번째 묶음인지, 1부터)가 있는 보너스는
 * 그 묶음의 고른 돌파 단계 값을 씁니다. 묶음을 못 찾으면 저장된 value(1돌파 값)를 씁니다.
 */
export function weaponBonusesAt(weapon, rank) {
  const groups = rankGroups(weapon?.description)
  return (weapon?.bonuses ?? []).map((b) => {
    if (!b.rankRef) return b
    const raw = groups[b.rankRef - 1]?.[clampRank(rank) - 1]
    return { category: b.category, value: raw ? parseFloat(raw) : b.value }
  })
}

/** 설명에 돌파 단계 묶음이 하나라도 있으면 true(돌파 선택을 보여줄지 판단). */
export const hasRankValues = (weapon) => rankGroups(weapon?.description).length > 0
