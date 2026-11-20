// 가방 화면 서브 옵션 줄 왼쪽 아이콘으로 옵션 이름을 찾습니다.
// OCR이 "크리티컬"을 "He A2|EIY"로, "HP"를 "@110"으로 읽는 것처럼 이름 글자는 자주 깨지지만, 아이콘 모양은 옵션마다 고정이라 훨씬 안정적입니다.
// 기준 아이콘(subStatIconTemplates.json)은 test/ocr-fixtures 가방 샘플에서 옵션별로 잘라 평균 낸 것입니다.
// 샘플 절반으로 만들고 나머지 606줄로 시험했을 때 모두 맞았고, 1등과 2등 차이가 1.54배 이상이었습니다.
// 공격력/공격력%처럼 고정값과 %가 같은 아이콘을 쓰므로 여기서는 이름만 정하고, %는 수치로 정합니다.
import TEMPLATES from '../config/subStatIconTemplates.json'

const SIZE = 20
// 1920x1080 기준(오른쪽 끝 맞춤). 첫 서브 옵션 줄 아이콘 중심 y와 줄 간격입니다.
const ICON = { x: 1328, size: 38, firstY: 562.5, pitch: 44.7 }
const ROWS = 5
// 같은 옵션 샘플은 기준과의 거리가 최대 107이었습니다. 이보다 한참 멀면 아이콘이 없는 줄(잠김·빈칸)로 봅니다.
const MAX_DISTANCE = 300
const MIN_MARGIN = 1.3

const LABELS = Object.keys(TEMPLATES)

/** 아이콘을 작게 줄여 흑백으로 만들고, 밝기 차이를 없애려고 평균 0·표준편차 1로 맞춥니다(뒤 배경 밝기가 화면마다 달라서). */
function iconVector(area, row) {
  const scale = area.height / 1080
  const cy = ICON.firstY + ICON.pitch * row
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    area,
    area.width - (1920 - ICON.x) * scale,
    (cy - ICON.size / 2) * scale,
    ICON.size * scale,
    ICON.size * scale,
    0,
    0,
    SIZE,
    SIZE,
  )
  const d = ctx.getImageData(0, 0, SIZE, SIZE).data
  const v = new Array(SIZE * SIZE)
  for (let i = 0; i < v.length; i++) v[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
  const mean = v.reduce((a, b) => a + b, 0) / v.length
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length) || 1
  return v.map((x) => (x - mean) / sd)
}

function distance(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2
  return s
}

/** 서브 옵션 5줄 각각의 옵션 이름(% 없이)을 돌려줍니다. 확실하지 않은 줄은 null. */
export function matchSubStatIcons(area) {
  return Array.from({ length: ROWS }, (_, row) => {
    const v = iconVector(area, row)
    const ranked = LABELS.map((label) => ({ label, d: distance(v, TEMPLATES[label]) })).sort((a, b) => a.d - b.d)
    const [best, second] = ranked
    if (best.d > MAX_DISTANCE || second.d < best.d * MIN_MARGIN) return null
    return best.label
  })
}

/** OCR 줄의 위치(서브 옵션 크롭 안의 y)로 몇 번째 줄인지 계산합니다. */
export function rowOfLine(bbox, regionY, ocrScale) {
  const centerY = regionY + (bbox.y0 + bbox.y1) / 2 / ocrScale
  const row = Math.round((centerY - ICON.firstY) / ICON.pitch)
  return row >= 0 && row < ROWS ? row : null
}
