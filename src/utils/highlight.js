function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function isYellowish(r, g, b) {
  // 어두운 남색 배경(--bg-surface 계열)과 뚜렷이 다른 노랑/골드 계열 색상인지 판별
  return r > 120 && g > 100 && b < 110 && r - b > 40 && g - b > 15
}

/**
 * 서브스탯 크롭 이미지에서, OCR로 얻은 각 줄(line)의 bbox 왼쪽 여백 배경색을 샘플링해
 * 노란색으로 하이라이트된 줄인지 판별합니다. 배열 순서는 lines 순서와 동일합니다.
 * @param {Blob} blob - 서브스탯 영역 크롭 이미지
 * @param {{bbox: {x0:number,y0:number,x1:number,y1:number}}[]} lines
 * @returns {Promise<boolean[]>}
 */
export async function detectHighlightedLines(blob, lines) {
  if (!lines || lines.length === 0) return []

  const img = await blobToImage(blob)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  return lines.map((line) => {
    const { x0, y0, y1 } = line.bbox
    const sampleX = Math.min(Math.max(x0 - 6, 0), canvas.width - 1)
    const sampleY = Math.min(Math.max(Math.round((y0 + y1) / 2), 0), canvas.height - 1)
    try {
      const [r, g, b] = ctx.getImageData(sampleX, sampleY, 1, 1).data
      return isYellowish(r, g, b)
    } catch {
      return false
    }
  })
}
