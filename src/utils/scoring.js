import { SUB_STAT_OPTIONS } from '../config/subStatOptions'

/**
 * "명조 스펙 계산기" 엑셀의 실제 엔진을 역추적해서 옮긴 계산식입니다. 검증 방법: 계산기 시트
 * R6:R10(에코1~5 점수) → 점수!E36:I36 → 점수!E35:I35("합") → 점수!E27:E33(XLOOKUP against
 * 연산!M36:M51) 순으로 다 따라가서, 양양_현령 예시 데이터로 5개 에코 전부 소수점 둘째 자리까지
 * 정확히 일치하는 걸 확인했습니다(52.03 / 52.75 / 58.55 / 49.71 / 57.39).
 *
 * 계산 순서:
 *   1) 스탯마다 "값 × 배율"을 정수로 내림(TRUNC)한 게 그 스탯의 점수.
 *      크리티컬 6.3% × 20 = 126, 크리티컬 피해 12.6% × 10 = 126, 강공격 피해 9.4% × 8 = 75(내림) 등.
 *   2) 유효 옵션인 스탯들의 점수를 더한 게 그 에코의 원점수.
 *   3) 크리티컬%와 크리티컬 피해%를 둘 다 가진 에코 개수 × 2%를, 전체 에코에 공통으로 곱합니다
 *      (예: 5장 다 크크 조합이면 ×1.10). 곱한 뒤 다시 정수로 내림.
 *   4) 그 값을 캐릭터별 "이론상 최대치"로 나누고 100을 곱해 %로 표시합니다(소수 둘째 자리 반올림).
 */
const RATE = {
  HP: 0.1,
  공격력: 1,
  방어력: 1,
  'HP%': 10,
  '공격력%': 10,
  '방어력%': 8,
  '크리티컬%': 20,
  '크리티컬 피해%': 10,
  '강공격 피해 보너스%': 8,
  '일반 공격 피해 보너스%': 8,
  '공명 스킬 피해 보너스%': 8,
  '공명 해방 피해 보너스%': 8,
  '공명 효율%': 0, // 원본 시트에도 이 표에는 없고, 별도의 "목표 공효 달성" 가산점으로 처리되는 항목
}

/**
 * 캐릭터별 "이론상 최대치" 나눗값(계산기!R6:R10이 참조하는 점수!E36:I36의 SWITCH문에서 그대로
 * 가져옴). 목록에 없는 캐릭터는 원본 시트도 기본값 690을 씁니다.
 */
const CHARACTER_MAX_DIVISOR = {
  시그리카: 807,
  브렌트: 752,
  플로로: 702,
  갈브레나: 702,
}
const DEFAULT_DIVISOR = 690

/** 해당 스탯 값이 SUB_STAT_OPTIONS 중 몇 번째 단계인지(1부터 시작) 반환합니다. 못 찾으면 0. */
export function tierOf(label, valueText) {
  const options = SUB_STAT_OPTIONS[label]
  if (!options) return 0
  const num = parseFloat(valueText)
  const idx = options.findIndex((v) => v === num)
  return idx === -1 ? 0 : idx + 1
}

/** 값 × 배율을 정수로 내림합니다(엑셀의 TRUNC와 동일). */
export function pointsForStat(label, valueText) {
  const rate = RATE[label] ?? 0
  const num = parseFloat(valueText)
  if (Number.isNaN(num)) return 0
  return Math.trunc(num * rate)
}

/**
 * 캡처된 모든 서브 스탯을 화면 표시용으로 정리합니다. 유효 옵션(validLabels)에 해당하면
 * valid: true 로 표시되고 점수에 반영되며, 아닌 것은 valid: false 로 표시만 되고 점수에는
 * 반영되지 않습니다.
 */
export function buildDisplayBreakdown(subStats, validLabels) {
  return subStats
    .filter((s) => s.label && s.valueText)
    .map((s) => {
      const valid = validLabels.includes(s.label)
      const points = valid ? pointsForStat(s.label, s.valueText) : 0
      return {
        label: s.label,
        valueText: s.valueText,
        tier: tierOf(s.label, s.valueText),
        valid,
        points,
      }
    })
}

/** 유효 옵션에 해당하는 서브스탯의 "원점수"(%변환 전) 합계입니다. */
export function computeEchoRawPoints(subStats, validLabels) {
  return buildDisplayBreakdown(subStats, validLabels).reduce((sum, b) => sum + b.points, 0)
}

/** 이 에코에 크리티컬%와 크리티컬 피해%가 (유효 옵션 여부와 무관하게) 둘 다 있는지 확인합니다. */
function hasCritPair(subStats) {
  const labels = subStats.map((s) => s.label)
  return labels.includes('크리티컬%') && labels.includes('크리티컬 피해%')
}

function getDivisor(characterName) {
  return CHARACTER_MAX_DIVISOR[characterName] ?? DEFAULT_DIVISOR
}

/**
 * 에코 세트 전체(여러 장)를 기준으로 각 에코의 %점수를 계산합니다. "크크 가산점"(크리티컬 + 크리티컬
 * 피해를 모두 갖춘 에코 개수 × 2%)이 전체 에코에 공통으로 곱해지고, 캐릭터별 이론상 최대치로 나눠
 * 100을 곱합니다. echoes 배열 전체를 넘겨야 정확합니다(가산점이 전체 세트 기준이라서).
 */
export function computeSetScores(echoes, validLabels, characterName) {
  const critRatioCount = echoes.filter((e) => hasCritPair(e.subStats)).length
  const multiplier = 1 + critRatioCount * 0.02
  const divisor = getDivisor(characterName)

  return echoes.map((echo) => {
    const rawPoints = computeEchoRawPoints(echo.subStats, validLabels)
    const adjusted = Math.trunc(rawPoints * multiplier)
    const percent = Math.round((adjusted / divisor) * 100 * 100) / 100
    return { echoId: echo.id, rawPoints, percent }
  })
}

// 티어별 표시 색상 (등급제를 다시 쓸 경우 대비해 남겨둠)
const TIER_COLORS = {
  F: '#a9754a',
  E: '#a9754a',
  D: '#a9754a',
  C: '#b9c2cc',
  B: '#b9c2cc',
  A: '#e8c547',
  L: '#a13f3f',
}

export function tierColor(tier) {
  return TIER_COLORS[tier] ?? 'var(--text-primary)'
}
