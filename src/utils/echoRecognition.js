// 공유 화면 한 프레임에서 에코 정보를 읽는 공용 로직입니다. 실시간 에코 체크와 에코 가방 정리가 함께 씁니다.
import { findGameArea } from '../components/ScreenCapture'
import { ECHO_SETS } from '../config/echoSets'
import { BAG_REGIONS, FIXED_REGIONS, LIVE_REGIONS } from '../config/regions'
import { MAIN_STAT_VALUES } from '../config/echoMainStats'
import { matchBagSetIcon } from './setIconMatch'
import { blobToDataURL, cropNormalizedImage, normalizeImage, preprocessForOcr } from './image'
import { buildStatsFromLines, closestMatch, normalizeMainStats, parseStatLines, snapSubStatsToCatalog } from './ocr'

// 가방 화면 상세 패널의 에코 그림 자리(1920x1080 기준, 오른쪽 끝 맞춤)입니다.
const BAG_ART = { x: 1615, y: 170, size: 245 }
const THUMB_SIZE = 72

/** 가방 화면의 에코 그림을 72px 썸네일(dataURL)로 만듭니다. 2천 개를 저장해도 부담 없는 크기입니다. */
export function bagThumbnail(area) {
  const scale = area.height / 1080
  const canvas = document.createElement('canvas')
  canvas.width = THUMB_SIZE
  canvas.height = THUMB_SIZE
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(area, area.width - (1920 - BAG_ART.x) * scale, BAG_ART.y * scale, BAG_ART.size * scale, BAG_ART.size * scale, 0, 0, THUMB_SIZE, THUMB_SIZE)
  return canvas.toDataURL('image/webp', 0.75)
}

// 가방 화면 글자 영역은 원래 크기(1080 기준)로 읽습니다. 샘플 8장 비교에서 1배가 2배보다 잘 읽혔습니다(34줄 vs 29줄).
const BAG_OCR_SCALE = 1
const CONTRAST = 1.6

/** 게임 화면 캔버스에서 1920x1080 기준(오른쪽 끝 맞춤) 영역을 잘라, 흑백·대비 보정한 캔버스로 돌려줍니다. */
function cropRightForOcr(area, region) {
  const scale = area.height / 1080
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(region.width * BAG_OCR_SCALE)
  canvas.height = Math.round(region.height * BAG_OCR_SCALE)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(area, area.width - (1920 - region.x) * scale, region.y * scale, region.width * scale, region.height * scale, 0, 0, canvas.width, canvas.height)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, (gray - 128) * CONTRAST + 128))
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

/**
 * 가방 화면 인식(빠른 경로). 서브·메인 옵션을 동시에 읽고(작업자가 여러 개면 병렬), 세트 아이콘·썸네일도 같이 만듭니다.
 * 에코 이름은 OCR 오류가 많고 사진으로 구분되므로 읽지 않습니다. 서브 옵션을 못 읽으면 에코 화면이 아닌 것으로 봅니다.
 */
async function recognizeBagPanel(area, ocr, { withViews }) {
  const crops = {
    sub: cropRightForOcr(area, BAG_REGIONS.subStat),
    main: cropRightForOcr(area, BAG_REGIONS.mainStat),
  }
  const [sub, main, setId] = await Promise.all([ocr.recognize(crops.sub), ocr.recognize(crops.main), matchBagSetIcon(area)])
  const views = withViews
    ? [
        { title: '가방 서브 옵션', image: crops.sub.toDataURL('image/png'), text: sub.text.trim() },
        { title: '가방 메인 옵션', image: crops.main.toDataURL('image/png'), text: main.text.trim() },
      ]
    : []
  const subStats = readSubStats(sub.lines)
  if (subStats.length === 0) return { subStats, main: null, setId: null, views }
  return {
    subStats,
    main: readMainStat(main.text),
    setId,
    thumbnail: bagThumbnail(area),
    views,
  }
}

/** 게임 화면을 높이 1080 기준으로 보고, 왼쪽 끝 기준 좌표의 영역을 잘라 냅니다(강화 화면용). */
export function cropFromLeft(source, h, region) {
  const scale = h / 1080
  // 공유 화면은 글자가 작아서 2배로 키워 인식합니다.
  const canvas = document.createElement('canvas')
  canvas.width = region.width * 2
  canvas.height = region.height * 2
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, region.x * scale, region.y * scale, region.width * scale, region.height * scale, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

// 수치가 없는 줄은 배경 잡음이나 잠긴 옵션 줄입니다. 그대로 두면 짧은 잡음이 "HP"에 맞춰져 최저 수치로 채워집니다.
export const readSubStats = (lines) =>
  snapSubStatsToCatalog(
    buildStatsFromLines(lines)
      .stats.filter((s) => s.valueText)
      .slice(0, 5),
  ).filter((s) => s.label && s.valueText)

/** 화음 이펙트 영역의 줄들에서 세트 이름을 찾습니다. "(2/2)" 같은 표시와 기호는 빼고 세트 목록과 대조합니다. */
export function findSetId(lines) {
  const names = Object.values(ECHO_SETS).map((set) => set.name)
  for (const line of lines) {
    const name = closestMatch(line.text.replace(/\(.*$/, '').replace(/[^가-힣\s]/g, '').trim(), names)
    if (name) return Object.keys(ECHO_SETS).find((id) => ECHO_SETS[id].name === name)
  }
  return null
}

/** 메인 옵션 첫 줄(% 수치)만 씁니다. 둘째 줄은 코스트로 고정된 플랫이라 비교할 필요가 없습니다. */
export const readMainStat = (text) => {
  const stat = normalizeMainStats(parseStatLines(text))[0]
  return stat?.label && stat.valueText?.includes('%') ? { label: stat.label, valueText: stat.valueText } : null
}

/** 메인 옵션의 이름과 수치가 일치하는 코스트를 찾습니다. 강화 중이거나 잘못 읽었으면 찾지 못합니다. */
export function costOfMain(main) {
  if (!main) return null
  if (main.cost) return main.cost
  return Object.keys(MAIN_STAT_VALUES).find((cost) => MAIN_STAT_VALUES[cost][main.label] === main.valueText) ?? null
}

/** 비디오의 현재 프레임에서 게임 화면 영역만 잘라 캔버스로 돌려줍니다. */
export function grabGameArea(video) {
  const frame = document.createElement('canvas')
  frame.width = video.videoWidth
  frame.height = video.videoHeight
  const frameCtx = frame.getContext('2d', { willReadFrequently: true })
  frameCtx.drawImage(video, 0, 0)
  const { x, y, w, h } = findGameArea(frameCtx, frame.width, frame.height)
  const area = document.createElement('canvas')
  area.width = w
  area.height = h
  area.getContext('2d').drawImage(frame, x, y, w, h, 0, 0, w, h)
  return area
}

/**
 * 게임 화면 캔버스에서 에코 패널을 읽습니다. 오른쪽 상세 패널을 먼저 보고, 못 읽으면 강화 화면(왼쪽 패널)으로 봅니다.
 * 반환: { subStats, main, setId, views } — 에코 화면이 아니면 subStats가 빈 배열입니다.
 * views는 실제로 글자 인식이 본 그림과 읽은 글자(디버그용)입니다. withViews가 false면 만들지 않습니다.
 */
export async function recognizeEchoPanel(area, session, { withViews = true, layout = 'character' } = {}) {
  if (layout === 'bag') return recognizeBagPanel(area, session, { withViews })
  const h = area.height
  const blob = await new Promise((resolve) => area.toBlob(resolve, 'image/png'))
  const { dataUrl } = await normalizeImage(new File([blob], 'live.png', { type: 'image/png' }))
  const views = []
  const read = async (title, image, preprocess = true) => {
    const input = preprocess ? await preprocessForOcr(image) : image
    const result = await session.recognize(input)
    if (withViews) views.push({ title, image: await blobToDataURL(input), text: result.text.trim() })
    return result
  }

  let subStats = readSubStats((await read('오른쪽 서브 옵션', await cropNormalizedImage(dataUrl, FIXED_REGIONS.subStat))).lines)
  let setId = null
  let main = null
  if (subStats.length > 0) {
    main = readMainStat((await read('오른쪽 메인 옵션', await cropNormalizedImage(dataUrl, FIXED_REGIONS.mainStat))).text)
    setId = findSetId((await read('화음 이펙트', await cropNormalizedImage(dataUrl, LIVE_REGIONS.sonata), false)).lines)
  } else {
    // 강화 화면에는 세트 표시가 없습니다.
    subStats = readSubStats((await read('왼쪽 서브 옵션', await cropFromLeft(area, h, LIVE_REGIONS.enhanceSubStat))).lines)
    if (subStats.length > 0) {
      main = readMainStat((await read('왼쪽 메인 옵션', await cropFromLeft(area, h, LIVE_REGIONS.enhanceMainStat))).text)
    }
  }
  return { subStats, main: subStats.length > 0 ? main : null, setId, views }
}
