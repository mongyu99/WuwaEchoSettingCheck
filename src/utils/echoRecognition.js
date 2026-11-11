// 공유 화면 한 프레임에서 에코 정보를 읽는 공용 로직입니다. 실시간 에코 체크와 에코 가방 정리가 함께 씁니다.
import { findGameArea } from '../components/ScreenCapture'
import { ECHO_SETS } from '../config/echoSets'
import { BAG_REGIONS, FIXED_REGIONS, LIVE_REGIONS } from '../config/regions'
import { MAIN_STAT_VALUES } from '../config/echoMainStats'
import { MAIN_ECHOES } from '../config/mainEchoes'
import { matchBagSetIcon } from './setIconMatch'
import { blobToDataURL, cropNormalizedImage, normalizeImage, preprocessForOcr } from './image'
import { buildStatsFromLines, closestMatch, normalizeMainStats, parseStatLines, snapSubStatsToCatalog } from './ocr'

/**
 * 에코 이름을 읽습니다. 카탈로그(메인 에코 목록)에 비슷한 이름이 있으면 그 이름으로 맞추고,
 * 없으면(카탈로그에 없는 1·3코스트 에코 등) 읽은 한글을 그대로 씁니다.
 */
export function readEchoName(text) {
  // 이름 위쪽 잡음이 한 줄로 따로 읽히는 경우가 있어서(예: "] 로" / "천괴중루") 모든 줄을 봅니다.
  const lines = text.split('\n').map(cleanNameLine).filter(Boolean)
  if (lines.length === 0) return null
  // 카탈로그 이름과 맞는 줄을 먼저 쓰고, 없으면 가장 긴 줄을 씁니다.
  const names = Object.values(MAIN_ECHOES).map((e) => e.name)
  const byLength = [...lines].sort((a, b) => b.length - a.length)
  return byLength.map((l) => matchEchoName(l, names)).find(Boolean) ?? byLength[0]
}

/** OCR 한 줄을 이름 후보로 다듬습니다. 이름이 아닌 잡음 줄이면 null. */
function cleanNameLine(raw) {
  // 이름 뒤 잡음은 긴 공백 뒤에 붙어 나옵니다(예: "보이드 모스        (후 /"). 공백 3칸 이상 뒤는 버립니다.
  // 짧은 공백 뒤에 붙은 한글 없는 토막(예: "반디의 군세 TA WAVE", "무망자 NW /,")도 떼어 냅니다.
  const tokens = raw.split(/\s{3,}/)[0].trim().split(/\s+/)
  while (tokens.length > 1 && !/[가-힣]/.test(tokens.at(-1))) tokens.pop()
  const head = tokens.join(' ')
  // 한글이 적은 줄은 잡음입니다(예: "Ham 6547~래래").
  const visible = head.replace(/\s/g, '')
  const hangul = (visible.match(/[가-힣]/g) ?? []).length
  if (hangul < 2 || hangul / visible.length < 0.6) return null
  // 「공명의 메아리 · 플뢰르 드 리스」처럼 가운뎃점이 들어간 이름이 있어, 점은 살리고 나머지 기호만 지웁니다.
  const cleaned = head
    // 가운뎃점은 ㆍ·•~- 등으로 읽힙니다(예: "이상-무망자", "이상ㆍ-무망자").
    .replace(/[ㆍ•∙·~-]/g, ' · ')
    .replace(/[^가-힣\s·]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(\s*·\s*)+/g, ' · ')
    .replace(/^[\s·]+|[\s·]+$/g, '')
  return cleaned.replace(/[\s·]/g, '').length >= 2 ? cleaned : null
}

// 같은 에코의 변형(이상·악몽·공명의 메아리)은 이름 뒷부분이 같아서, 느슨하게 맞추면 다른 변형으로 바뀝니다.
const variantOf = (name) => {
  const parts = name.split('·').map((p) => p.replace(/\s/g, ''))
  return parts.length > 1 ? parts.slice(0, -1).join('·') : ''
}

/**
 * 카탈로그 이름과 맞춥니다. 변형 앞부분(예: "이상", "악몽")이 정확히 같고, 글자 차이가 이름 길이의 25% 이하일 때만 인정합니다.
 */
function matchEchoName(line, names) {
  const target = line.replace(/[\s·]/g, '')
  let best = null
  let bestDist = Infinity
  for (const name of names) {
    if (variantOf(name) !== variantOf(line)) continue
    const plain = name.replace(/[\s·]/g, '')
    const dist = editDistance(target, plain)
    if (dist <= Math.max(1, Math.floor(plain.length * 0.25)) && dist < bestDist) {
      best = name
      bestDist = dist
    }
  }
  return best
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

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
 * 가방 화면 인식(빠른 경로). 서브·메인·이름을 동시에 읽고(작업자가 여러 개면 병렬), 세트 아이콘·썸네일도 같이 만듭니다.
 * 서브 옵션을 못 읽으면 에코 화면이 아닌 것으로 봅니다.
 */
async function recognizeBagPanel(area, ocr, { withViews }) {
  const crops = {
    sub: cropRightForOcr(area, BAG_REGIONS.subStat),
    main: cropRightForOcr(area, BAG_REGIONS.mainStat),
    name: cropRightForOcr(area, BAG_REGIONS.name),
  }
  const [sub, main, name, setId] = await Promise.all([
    ocr.recognize(crops.sub),
    ocr.recognize(crops.main),
    ocr.recognize(crops.name),
    matchBagSetIcon(area),
  ])
  const views = withViews
    ? [
        { title: '가방 서브 옵션', image: crops.sub.toDataURL('image/png'), text: sub.text.trim() },
        { title: '가방 메인 옵션', image: crops.main.toDataURL('image/png'), text: main.text.trim() },
        { title: '가방 에코 이름', image: crops.name.toDataURL('image/png'), text: name.text.trim() },
      ]
    : []
  const subStats = readSubStats(sub.lines)
  if (subStats.length === 0) return { subStats, main: null, name: null, setId: null, views }
  return {
    subStats,
    main: readMainStat(main.text),
    name: readEchoName(name.text),
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
