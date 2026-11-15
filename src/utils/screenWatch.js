// 스탯 패널이 있는 화면 오른쪽만 작게 줄여 비교합니다. 이 값보다 많이 달라졌을 때만 글자 인식을 돌립니다.
const SIGNATURE_SIZE = 32
const CHANGE_THRESHOLD = 4

export function panelSignature(source, w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = SIGNATURE_SIZE
  canvas.height = SIGNATURE_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  // 왼쪽 절반은 강화 화면 패널, 오른쪽 절반은 에코 목록 화면 패널 자리입니다.
  const half = SIGNATURE_SIZE / 2
  ctx.drawImage(source, w * 0.05, h * 0.2, w * 0.25, h * 0.3, 0, 0, half, SIGNATURE_SIZE)
  ctx.drawImage(source, w * 0.75, h * 0.2, w * 0.25, h * 0.3, half, 0, half, SIGNATURE_SIZE)
  return toGray(ctx, SIGNATURE_SIZE, SIGNATURE_SIZE)
}

export function signatureChanged(a, b) {
  if (!a) return true
  let diff = 0
  for (let i = 0; i < a.length; i++) diff += Math.abs(a[i] - b[i])
  return diff / a.length > CHANGE_THRESHOLD
}

// 가방 화면: 이름 줄과 옵션 표(글자 부분)만 촘촘하게 봅니다(1920x1080 기준, 오른쪽 끝 맞춤).
// 상세 패널의 에코 그림은 3D 모델이 계속 움직여서, 넣으면 항상 "움직이는 중"으로 보여 캡처가 안 됩니다.
// 같은 이름의 에코끼리는 수치 몇 글자만 달라서, 평균이 아니라 "바뀐 칸 수"로 판단합니다.
export const BAG_WATCH_REGIONS = [
  { x: 1315, y: 115, width: 550, height: 55 }, // 이름
  { x: 1315, y: 452, width: 550, height: 318 }, // 메인 + 서브 옵션
]
const BAG_SIG_W = 64
const BAG_SIG_H = [16, 112] // 영역별 높이(합 128)
const CELL_CHANGE = 24 // 이만큼 밝기가 바뀐 칸을 "바뀐 칸"으로 셉니다.
export const MIN_CHANGED_CELLS = 6 // 바뀐 칸이 이 개수 이상이면 화면이 바뀐 것으로 봅니다(숫자 한 글자 정도).

export function bagPanelSignature(source, w, h) {
  // 게임 화면은 높이 1080 기준으로 맞추고 오른쪽 끝을 기준으로 둡니다(넓은 화면 대응).
  const scale = h / 1080
  const canvas = document.createElement('canvas')
  canvas.width = BAG_SIG_W
  canvas.height = BAG_SIG_H[0] + BAG_SIG_H[1]
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  let top = 0
  BAG_WATCH_REGIONS.forEach((r, i) => {
    ctx.drawImage(source, w - (1920 - r.x) * scale, r.y * scale, r.width * scale, r.height * scale, 0, top, BAG_SIG_W, BAG_SIG_H[i])
    top += BAG_SIG_H[i]
  })
  return toGray(ctx, canvas.width, canvas.height)
}

/** 두 화면에서 밝기가 크게 바뀐 칸 수입니다(이전 화면이 없으면 Infinity). */
export function bagSignatureDiff(a, b) {
  if (!a) return Infinity
  let changed = 0
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > CELL_CHANGE) changed++
  return changed
}

export const bagSignatureChanged = (a, b) => bagSignatureDiff(a, b) >= MIN_CHANGED_CELLS

function toGray(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height)
  const gray = new Uint8Array(width * height)
  for (let i = 0; i < gray.length; i++) gray[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3
  return gray
}
