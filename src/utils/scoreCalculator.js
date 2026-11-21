/**
 * 스탯별 가중치 설정.
 * 실제 게임의 서브스탯 롤 범위/우선순위에 맞춰 이 값을 자유롭게 조정하세요.
 * weight가 높을수록 점수에 크게 반영됩니다.
 * maxRoll은 해당 스탯의 "이론상 최고 수치 1회 굴림 값" 기준입니다 (퍼센트 단위는 % 그대로 입력).
 */
export const STAT_WEIGHTS = {
  '치명타': { weight: 1, maxRoll: 6.3 },
  '치명타 피해': { weight: 1, maxRoll: 12.6 },
  '공격력%': { weight: 0.8, maxRoll: 7.9 },
  '공격력': { weight: 0.3, maxRoll: 40 },
  '체력%': { weight: 0.3, maxRoll: 7.9 },
  '방어력%': { weight: 0.2, maxRoll: 10 },
  '공명 효율': { weight: 0.5, maxRoll: 6.8 },
  '속성 피해': { weight: 0.9, maxRoll: 7.9 },
  '기본 공격 피해': { weight: 0.6, maxRoll: 7.9 },
  '중공격 피해': { weight: 0.6, maxRoll: 7.9 },
}
