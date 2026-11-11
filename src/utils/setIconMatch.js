// 가방 화면의 에코 세트 아이콘(이름 아래 "+25" 옆 원형 아이콘)을 사이트의 세트 아이콘과 비교해 세트를 찾습니다.
// 게임 아이콘과 사이트 아이콘은 같은 디자인(색 테두리 + 어두운 안쪽 + 흰 문양)이라, 작게 줄여 색 차이를 비교합니다.
// 테스트 스크린샷 9장에서 모두 맞았고, 1등과 2등의 차이가 1.9배 이상이었습니다.
import { ECHO_SETS } from '../config/echoSets'

const SIZE = 24
// 1920x1080 기준(오른쪽 끝 맞춤) 아이콘 위치입니다.
const ICON = { x: 1401, y: 199, size: 28 }
// 1등이 2등보다 이만큼 이상 확실히 가까워야 세트로 인정합니다. 아니면 "세트 모름".
const MIN_MARGIN = 1.3

// 원 안쪽만 비교합니다(아이콘 바깥 배경은 화면마다 달라서).
const MASK = Array.from({ length: SIZE * SIZE }, (_, i) => {
  const x = i % SIZE
  const y = Math.floor(i / SIZE)
  return Math.hypot(x - SIZE / 2 + 0.5, y - SIZE / 2 + 0.5) <= SIZE / 2 - 1
})

function toPixels(source, sx, sy, sw, sh) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#111' // 투명한 부분은 어두운 배경으로 봅니다.
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, SIZE, SIZE)
  return ctx.getImageData(0, 0, SIZE, SIZE).data
}

function distance(a, b) {
  let d = 0
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (!MASK[i]) continue
    const p = i * 4
    d += Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2])
  }
  return d
}

let referencePromise = null

/** 사이트 세트 아이콘을 한 번만 불러와 비교용 픽셀로 바꿔 둡니다. */
function loadReferences() {
  referencePromise ??= Promise.all(
    Object.entries(ECHO_SETS)
      .filter(([, set]) => set.icon)
      .map(
        ([id, set]) =>
          new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve({ id, px: toPixels(img, 0, 0, img.naturalWidth, img.naturalHeight) })
            img.onerror = () => resolve(null)
            img.src = set.icon
          }),
      ),
  ).then((list) => list.filter(Boolean))
  return referencePromise
}

/** 게임 화면 캔버스(가방 화면)에서 세트 아이콘을 찾아 세트 id를 돌려줍니다. 확실하지 않으면 null. */
export async function matchBagSetIcon(area) {
  const refs = await loadReferences()
  if (refs.length < 2) return null
  const scale = area.height / 1080
  const sx = area.width - (1920 - ICON.x) * scale
  const px = toPixels(area, sx, ICON.y * scale, ICON.size * scale, ICON.size * scale)
  const ranked = refs.map((r) => ({ id: r.id, d: distance(px, r.px) })).sort((a, b) => a.d - b.d)
  return ranked[1].d >= ranked[0].d * MIN_MARGIN ? ranked[0].id : null
}
