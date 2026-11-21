// 목표 스탯 계산기에 넣을 수 있는 목표 종류(계산은 jointOptimizer.js)
// (기준값 + %) 형태로 계산해야 하는 카테고리와, %만으로 계산되는 카테고리
export const BASE_PERCENT_CATEGORIES = {
  공격력: { percentLabel: '공격력%', flatLabel: '공격력' },
  방어력: { percentLabel: '방어력%', flatLabel: '방어력' },
  HP: { percentLabel: 'HP%', flatLabel: 'HP' },
}
export const PERCENT_ONLY_CATEGORIES = {
  '공명 효율': { percentLabel: '공명 효율%' },
  크리티컬: { percentLabel: '크리티컬%' },
  '크리티컬 피해': { percentLabel: '크리티컬 피해%' },
  // 에코 서브 옵션으로 챙길 수 있는 피해 보너스도 목표로 넣을 수 있습니다.
  '일반 공격 피해': { percentLabel: '일반 공격 피해 보너스%' },
  '강공격 피해': { percentLabel: '강공격 피해 보너스%' },
  '공명 스킬 피해': { percentLabel: '공명 스킬 피해 보너스%' },
  '공명 해방 피해': { percentLabel: '공명 해방 피해 보너스%' },
}
export const OPTIMIZER_CATEGORIES = { ...BASE_PERCENT_CATEGORIES, ...PERCENT_ONLY_CATEGORIES }
