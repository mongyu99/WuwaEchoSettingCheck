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
  const { data } = ctx.getImageData(0, 0, SIGNATURE_SIZE, SIGNATURE_SIZE)
  const gray = new Uint8Array(SIGNATURE_SIZE * SIGNATURE_SIZE)
  for (let i = 0; i < gray.length; i++) gray[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3
  return gray
}

export function signatureChanged(a, b) {
  if (!a) return true
  let diff = 0
  for (let i = 0; i < a.length; i++) diff += Math.abs(a[i] - b[i])
  return diff / a.length > CHANGE_THRESHOLD
}
