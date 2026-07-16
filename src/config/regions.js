/**
 * 모든 업로드 이미지는 1920x1080으로 정규화되기 때문에, 서브스탯 패널의 위치가
 * 항상 같은 자리에 나온다는 전제로 영역 좌표를 고정값으로 둡니다.
 *
 * 아래 숫자는 예시로 주신 스크린샷을 기준으로 잡은 1차 추정치입니다.
 * 실제 화면에서 박스 위치가 어긋나 보이면, x/y/width/height 값만 조정하면 됩니다.
 * (x, y는 좌상단 기준, 모두 1920x1080 좌표계의 px 값)
 *
 * 이름·코스트 영역은 인식률이 낮아 더 이상 사용하지 않습니다.
 */
export const FIXED_REGIONS = {
    mainStat: { x: 1485, y: 230, width: 385, height: 70 },
    subStat: { x: 1485, y: 300, width: 385, height: 180 },
}

export const REGION_META = [
  { key: 'mainStat', label: '메인 스탯 (2줄)', varName: '--region-main' },
  { key: 'subStat', label: '서브 스탯 (0~5줄)', varName: '--region-sub' },
]

const PADDING = 14
const NAME_AREA_HEIGHT = 90 // 더 이상 OCR하지는 않지만, 미리보기에는 이름 줄까지 보이도록 위쪽 여백을 늘립니다.

/** 결과 카드 옆에 보여줄 "스캔한 부분만" 미리보기 영역 (이름 · 메인 · 서브 스탯을 감싸는 범위 + 여백) */
export const SCAN_PREVIEW_REGION = (() => {
  const rects = Object.values(FIXED_REGIONS)
  const minX = Math.min(...rects.map((r) => r.x)) - PADDING
  const minY = Math.min(...rects.map((r) => r.y)) - PADDING - NAME_AREA_HEIGHT
  const maxX = Math.max(...rects.map((r) => r.x + r.width)) + PADDING
  const maxY = Math.max(...rects.map((r) => r.y + r.height)) + PADDING
  return {
    x: Math.max(0, minX),
    y: Math.max(0, minY),
    width: maxX - Math.max(0, minX),
    height: maxY - Math.max(0, minY),
  }
})()
