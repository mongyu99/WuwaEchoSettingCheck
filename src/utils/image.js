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

function drawScaled(source, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, width, height)
  return canvas
}

/**
 * 해상도·비율과 상관없이 1920x1080 캔버스로 맞춥니다. 인식 영역(config/regions.js)이 1920x1080
 * 좌표 기준입니다. 게임은 화면이 넓어져도(21:9 등) UI를 높이 기준으로 키우고 스탯 패널을 오른쪽 끝에
 * 붙이므로, 높이를 1080에 맞춘 뒤 오른쪽 끝을 기준으로 1920 너비만 남깁니다(16:9보다 좁으면 왼쪽이 빔).
 * 4K처럼 큰 사진은 한 번에 줄이면 글자가 뭉개져서, 절반씩 단계적으로 줄인 뒤 마지막에 맞춥니다.
 */
export async function normalizeImage(file) {
  const { img, url } = await loadImage(file)

  let source = img
  let w = img.naturalWidth
  let h = img.naturalHeight
  while (h / 2 >= TARGET_HEIGHT) {
    w = Math.round(w / 2)
    h = Math.round(h / 2)
    source = drawScaled(source, w, h)
  }

  const scaledW = Math.round(w * (TARGET_HEIGHT / h))
  const canvas = document.createElement('canvas')
  canvas.width = TARGET_WIDTH
  canvas.height = TARGET_HEIGHT
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, TARGET_WIDTH - scaledW, 0, scaledW, TARGET_HEIGHT)

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
