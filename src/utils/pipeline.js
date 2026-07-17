import { normalizeImage, cropNormalizedImage, blobToDataURL } from './image'
import { FIXED_REGIONS, REGION_META, SCAN_PREVIEW_REGION } from '../config/regions'

/**
 * 원본 파일 하나를 받아 정규화 + 고정 영역 크롭 + 미리보기까지 만들어 반환합니다.
 * 사진 한 장만 다시 인식(교체)할 때 씁니다. 해상도가 너무 낮으면 에러를 던집니다.
 */
export async function prepareImageForExtraction(file) {
  const { dataUrl } = await normalizeImage(file)

  const crops = {}
  for (const meta of REGION_META) {
    crops[meta.key] = await cropNormalizedImage(dataUrl, FIXED_REGIONS[meta.key])
  }

  const previewBlob = await cropNormalizedImage(dataUrl, SCAN_PREVIEW_REGION)
  const previewUrl = await blobToDataURL(previewBlob)

  return { crops, previewUrl }
}
