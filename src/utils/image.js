export const TARGET_WIDTH = 1920
export const TARGET_HEIGHT = 1080
export const MAX_IMAGES = 5

/**
 * Blob을 base64 dataURL 문자열로 변환합니다. blob: object URL과 달리 JSON으로 직렬화해서
 * localStorage에 저장할 수 있어, 미리보기 이미지를 저장/복원할 때 씁니다.
 */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 불러올 수 없습니다.'))
    }
    img.src = url
  })
}

/**
 * 파일을 검증하고 1920x1080으로 정규화합니다.
 * - 원본이 1920x1080보다 작으면 에러를 던집니다 (인식 실패 처리).
 * - 그 이상이면 비율을 유지한 채 1920x1080을 꽉 채우도록 잘라서(cover) 리사이즈합니다.
 *   (단순히 늘려버리면 비율이 왜곡되어 OCR 위치가 어긋나기 때문입니다.)
 */
export async function normalizeImage(file) {
  const { img, url } = await loadImage(file)
  const { naturalWidth: w, naturalHeight: h } = img

  if (w < TARGET_WIDTH || h < TARGET_HEIGHT) {
    URL.revokeObjectURL(url)
    const err = new Error(
      `해상도가 너무 낮습니다 (${w}×${h}). 최소 ${TARGET_WIDTH}×${TARGET_HEIGHT} 이상이어야 합니다.`,
    )
    err.code = 'RESOLUTION_TOO_LOW'
    throw err
  }

  const scale = Math.max(TARGET_WIDTH / w, TARGET_HEIGHT / h)
  const scaledW = w * scale
  const scaledH = h * scale
  const offsetX = (scaledW - TARGET_WIDTH) / 2
  const offsetY = (scaledH - TARGET_HEIGHT) / 2

  const canvas = document.createElement('canvas')
  canvas.width = TARGET_WIDTH
  canvas.height = TARGET_HEIGHT
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, -offsetX, -offsetY, scaledW, scaledH)

  URL.revokeObjectURL(url)

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
  }
}

/** 정규화된(1920x1080) dataURL 이미지에서 지정한 픽셀 영역만 잘라 Blob으로 반환합니다. */
export function cropNormalizedImage(dataUrl, cropPx) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropPx.width
      canvas.height = cropPx.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        img,
        cropPx.x,
        cropPx.y,
        cropPx.width,
        cropPx.height,
        0,
        0,
        cropPx.width,
        cropPx.height,
      )
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * OCR 인식용으로만 쓰는 전처리본을 만듭니다. 그레이스케일로 바꾸고 대비를 강하게 줘서,
 * 캐릭터 렌더링 같은 배경이 패널 뒤로 비칠 때 생기는 잡음을 줄이고 글자를 도드라지게 합니다.
 * 화면 표시용(미리보기)이나 노란색 하이라이트 판별에는 원본 컬러 이미지를 그대로 써야 합니다.
 */
export function preprocessForOcr(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data
      const CONTRAST = 1.6
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const adjusted = Math.max(0, Math.min(255, (gray - 128) * CONTRAST + 128))
        d[i] = d[i + 1] = d[i + 2] = adjusted
      }
      ctx.putImageData(imageData, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob((out) => resolve(out), 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('전처리용 이미지를 불러올 수 없습니다.'))
    }
    img.src = url
  })
}
