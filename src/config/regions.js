/**
  스캔 처리 부분
 */
export const FIXED_REGIONS = {
  cost: { x: 1485, y: 195, width: 385, height: 35 },
  mainStat: { x: 1485, y: 230, width: 385, height: 70 },
  subStat: { x: 1485, y: 300, width: 385, height: 180 },
}

export const REGION_META = [
  { key: 'cost', label: '코스트', varName: '--region-name' },
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
