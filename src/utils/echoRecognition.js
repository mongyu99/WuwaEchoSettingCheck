// 공유 화면 한 프레임에서 에코 정보를 읽는 공용 로직입니다. 실시간 에코 체크와 에코 가방 정리가 함께 씁니다.
import { findGameArea } from '../components/ScreenCapture'
import { ECHO_SETS } from '../config/echoSets'
import { BAG_REGIONS, FIXED_REGIONS, LIVE_REGIONS } from '../config/regions'
import { MAIN_STAT_VALUES } from '../config/echoMainStats'
import { matchBagSetIcon } from './setIconMatch'
import { blobToDataURL, canvasToBlob, cropNormalizedImage, normalizeImage, preprocessForOcr } from './image'
import { matchSubStatIcons, rowOfLine } from './subStatIconMatch'
import { matchMainEchoName } from './mainEchoName'
import { SUB_STAT_NAMES } from '../config/subStatOptions'

const SUB_STAT_BASE_NAMES = [...new Set(SUB_STAT_NAMES.map((n) => n.replace(/%$/, '')))]
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
    // 에코 이름: 캐릭터 추천에서 메인 에코 자리를 고정하려고 메인 에코 목록과 맞춰 봅니다.
    name: cropRightForOcr(area, BAG_REGIONS.name),
  }
  const [sub, main, setId, name] = await Promise.all([
    ocr.recognize(crops.sub),
    ocr.recognize(crops.main),
    matchBagSetIcon(area),
    ocr.recognize(crops.name),
  ])
  const views = withViews
    ? [
        { title: '가방 서브 옵션', image: crops.sub.toDataURL('image/png'), text: sub.text.trim() },
        { title: '가방 메인 옵션', image: crops.main.toDataURL('image/png'), text: main.text.trim() },
        { title: '가방 에코 이름', image: crops.name.toDataURL('image/png'), text: name.text.trim() },
      ]
    : []
  const subStats = readBagSubStats(sub.lines, matchSubStatIcons(area))
  if (subStats.length === 0) return { subStats, main: null, setId: null, views }
  return {
    subStats,
    main: readMainStat(main.text),
    setId,
    echoId: matchMainEchoName(name.text),
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
  return canvasToBlob(canvas)
}

// 수치가 없는 줄은 배경 잡음이나 잠긴 옵션 줄입니다. 그대로 두면 짧은 잡음이 "HP"에 맞춰져 최저 수치로 채워집니다.
export const readSubStats = (lines) =>
  snapSubStatsToCatalog(
    buildStatsFromLines(lines)
      .stats.filter((s) => s.valueText)
      .slice(0, 5),
  ).filter((s) => s.label && s.valueText)

/**
 * 가방 화면 서브 옵션: 옵션 이름은 줄 왼쪽 아이콘으로 정하고(글자보다 안정적), 수치만 OCR 글자를 씁니다.
 * 아이콘이 확실하지 않은 줄은 지금처럼 OCR 글자로 이름을 맞춥니다.
 */
export function readBagSubStats(lines, iconLabels) {
  const { stats, kept } = buildStatsFromLines(lines)
  const relabeled = stats.map((s, i) => {
    const bbox = kept[i]?.bbox
    const row = bbox ? rowOfLine(bbox, BAG_REGIONS.subStat.y, BAG_OCR_SCALE) : null
    const iconLabel = row === null ? null : iconLabels[row]
    return iconLabel && s.valueText ? { ...s, label: iconLabel } : s
  })
  return snapSubStatsToCatalog(relabeled.filter((s) => s.valueText).slice(0, 5)).filter((s) => s.label && s.valueText)
}

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
const MAIN_LABELS = [...new Set(Object.values(MAIN_STAT_VALUES).flatMap((byLabel) => Object.keys(byLabel)))]
// 메인 옵션 중 "○○ 피해 보너스"의 속성 이름(전도, 응결 등)
const ELEMENT_NAMES = MAIN_LABELS.map((l) => l.match(/^(\S{2}) 피해 보너스/)?.[1]).filter(Boolean)

export const readMainStat = (text) => {
  const parsed = parseStatLines(text)
  // 속성 피해 보너스는 앞 두 글자(전도·응결·용융…)만 다릅니다. 아이콘에 가리거나 잘려 그 두 글자를 못 읽으면
  // (예: "7, Me 피해 보너스") 모든 속성과 똑같이 가까워져 목록 맨 앞(응결)으로 잘못 맞춰졌습니다.
  // 보정 전 원문에 속성 이름이 없으면 이번 결과는 버립니다(실시간 인식은 바로 전 메인 옵션을 그대로 둡니다).
  const rawHead = (parsed[0]?.label ?? '').replace(/[^가-힣]/g, '')
  if (/피해보너스/.test(rawHead) && !ELEMENT_NAMES.some((el) => rawHead.includes(el))) return null
  const [rawStat, second] = normalizeMainStats(parsed)
  if (!rawStat?.label || !rawStat.valueText?.includes('%')) return null
  const head = rawStat.label.split(/\d/)[0].replace(/[^가-힣A-Za-z ]/g, '').trim()
  const stat = { ...rawStat, label: closestMatch(head, MAIN_LABELS) ?? rawStat.label }
  // 둘째 줄(코스트로 고정된 공격력/HP)은 강화 중 코스트를 추정하는 데 씁니다.
  return second?.valueText && !second.valueText.includes('%')
    ? { label: stat.label, valueText: stat.valueText, second: { label: second.label, valueText: second.valueText } }
    : { label: stat.label, valueText: stat.valueText }
}

// +25 기준 둘째 줄 고정값(코스트마다 다름)
const FIXED_SECOND = { 4: { label: '공격력', value: 150 }, 3: { label: '공격력', value: 100 }, 1: { label: 'HP', value: 2280 } }

/**
 * 메인 옵션으로 코스트를 찾습니다. +25면 수치가 표와 딱 맞고,
 * 강화 중(+25 전)이면 수치가 작아서 안 맞으므로 이렇게 추정합니다.
 * 1) 그 옵션이 한 코스트에만 있으면(크리티컬·크리티컬 피해·치료 → 4코, 공명 효율·속성 피해 → 3코) 그 코스트
 * 2) 둘째 줄이 HP면 1코
 * 3) 둘째 줄이 공격력이면(4코/3코) 첫째·둘째 줄이 같은 비율로 커지므로, 둘째 줄 비율로 +25 값을 되짚어 표와 가까운 코스트
 */
export function costOfMain(main) {
  if (!main) return null
  if (main.cost) return main.cost
  const exact = Object.keys(MAIN_STAT_VALUES).find((cost) => MAIN_STAT_VALUES[cost][main.label] === main.valueText)
  if (exact) return exact
  const candidates = Object.keys(MAIN_STAT_VALUES).filter((cost) => MAIN_STAT_VALUES[cost][main.label])
  if (candidates.length === 1) return candidates[0]
  const second = main.second
  if (!second || candidates.length === 0) return null
  const v1 = parseFloat(main.valueText)
  const v2 = parseFloat(second.valueText)
  const fitting = candidates.filter((cost) => FIXED_SECOND[cost].label === second.label)
  if (fitting.length === 1) return fitting[0]
  if (!v1 || !v2 || fitting.length === 0) return null
  const errorOf = (cost) => {
    const ratio = v2 / FIXED_SECOND[cost].value
    return Math.abs(v1 / ratio - parseFloat(MAIN_STAT_VALUES[cost][main.label]))
  }
  return fitting.sort((a, b) => errorOf(a) - errorOf(b))[0]
}

/** 비디오의 현재 프레임에서 게임 화면 영역만 잘라 캔버스로 돌려줍니다. */
export function grabGameArea(video) {
  return grabRect(video, findGameRect(video))
}

/** 공유 화면에서 게임 화면 위치(검은 여백 제외)를 찾습니다. 전체 화면을 픽셀로 읽어서 무거우므로 가끔만 부릅니다. */
export function findGameRect(video) {
  const frame = document.createElement('canvas')
  frame.width = video.videoWidth
  frame.height = video.videoHeight
  const frameCtx = frame.getContext('2d', { willReadFrequently: true })
  frameCtx.drawImage(video, 0, 0)
  return findGameArea(frameCtx, frame.width, frame.height)
}

/** 공유 화면에서 rect 영역만 새 캔버스로 잘라 냅니다(픽셀을 읽지 않아 가볍습니다). */
export function grabRect(video, { x, y, w, h }) {
  const area = document.createElement('canvas')
  area.width = w
  area.height = h
  area.getContext('2d').drawImage(video, x, y, w, h, 0, 0, w, h)
  return area
}

/**
 * 게임 화면 캔버스에서 에코 패널을 읽습니다. 오른쪽 상세 패널을 먼저 보고, 못 읽으면 강화 화면(왼쪽 패널)으로 봅니다.
 * 반환: { subStats, main, setId, views } — 에코 화면이 아니면 subStats가 빈 배열입니다.
 * views는 실제로 글자 인식이 본 그림과 읽은 글자(디버그용)입니다. withViews가 false면 만들지 않습니다.
 */
/**
 * 서브 옵션을 읽되, 옵션 이름은 읽혔는데 수치가 글자로 깨진 줄(예: "공격력 \"수")이 있으면
 * 같은 그림을 숫자 전용으로 한 번 더 읽어, 같은 높이의 줄에서 나온 숫자로 수치를 채웁니다.
 */
function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
  return dp[a.length][b.length]
}

async function readSubStatsWithDigitRetry(lines, input, session) {
  const { stats, kept } = buildStatsFromLines(lines)
  // 잡음(다른 화면을 읽은 경우)을 옵션 줄로 착각하지 않게: 수치까지 제대로 읽힌 줄이 이미 있고,
  // 이름이 옵션 이름과 거의 같은(한 글자 이내 차이) 줄만 다시 읽습니다. 예전엔 "Ps" 같은 잡음이 HP로 잡혀
  // 강화 화면에서 오른쪽 패널을 읽은 걸로 착각하고 왼쪽 강화 패널을 아예 안 읽는 문제가 있었습니다.
  if (!stats.some((s) => s.valueText) || !session.recognizeDigits) return readSubStats(lines)
  const nearName = (label) => {
    const read = label.replace(/[^가-힣A-Za-z]/g, '')
    if (read.length < 2) return false
    return SUB_STAT_BASE_NAMES.some((name) => editDistance(read, name.replace(/\s/g, '')) <= 1)
  }
  const missing = stats.map((s, i) => ({ s, i })).filter(({ s }) => s.label && !s.valueText && nearName(s.label))
  if (missing.length === 0) return readSubStats(lines)
  const digits = await session.recognizeDigits(input)
  const patched = kept.map((line, i) => {
    if (!missing.some((m) => m.i === i) || !line.bbox) return line
    const midY = (line.bbox.y0 + line.bbox.y1) / 2
    const hit = digits.lines.find((d) => d.bbox && d.bbox.y0 <= midY && midY <= d.bbox.y1)
    const token = hit?.text.match(/\d+(?:\.\d+)?%?/g)?.at(-1)
    return token ? { ...line, text: `${line.text.replace(/[^가-힣A-Za-z ]/g, '').trim()} ${token}` } : line
  })
  return readSubStats(patched)
}

export async function recognizeEchoPanel(area, session, { withViews = true, layout = 'character' } = {}) {
  if (layout === 'bag') return recognizeBagPanel(area, session, { withViews })
  const h = area.height
  const blob = await canvasToBlob(area)
  const { dataUrl } = await normalizeImage(new File([blob], 'live.png', { type: 'image/png' }))
  const views = []
  const read = async (title, image, preprocess = true) => {
    const input = preprocess ? await preprocessForOcr(image) : image
    const result = await session.recognize(input)
    if (withViews) views.push({ title, image: await blobToDataURL(input), text: result.text.trim() })
    return result
  }

  // 서브 옵션은 수치가 깨진 줄이 있으면 숫자 전용으로 한 번 더 읽습니다(그래서 전처리한 그림을 따로 들고 있음).
  const readSubs = async (title, image) => {
    const input = await preprocessForOcr(image)
    const result = await session.recognize(input)
    if (withViews) views.push({ title, image: await blobToDataURL(input), text: result.text.trim() })
    return readSubStatsWithDigitRetry(result.lines, input, session)
  }
  let subStats = await readSubs('오른쪽 서브 옵션', await cropNormalizedImage(dataUrl, FIXED_REGIONS.subStat))
  let setId = null
  let main = null
  let panel = 'right'
  if (subStats.length > 0) {
    main = readMainStat((await read('오른쪽 메인 옵션', await cropNormalizedImage(dataUrl, FIXED_REGIONS.mainStat))).text)
    setId = findSetId((await read('화음 이펙트', await cropNormalizedImage(dataUrl, LIVE_REGIONS.sonata), false)).lines)
  }
  // 오른쪽에서 메인 옵션까지 못 읽었으면 오른쪽 상세 패널이 아닌 것(강화 화면 배경의 잡음)으로 보고 왼쪽 강화 패널을 읽습니다.
  if (subStats.length > 0 && !main) {
    const left = await readSubs('왼쪽 서브 옵션', await cropFromLeft(area, h, LIVE_REGIONS.enhanceSubStat))
    if (left.length > 0) {
      subStats = left
      setId = null
      panel = 'left'
      main = readMainStat((await read('왼쪽 메인 옵션', await cropFromLeft(area, h, LIVE_REGIONS.enhanceMainStat))).text)
    }
  } else if (subStats.length === 0) {
    // 강화 화면에는 세트 표시가 없습니다.
    subStats = await readSubs('왼쪽 서브 옵션', await cropFromLeft(area, h, LIVE_REGIONS.enhanceSubStat))
    panel = 'left'
    if (subStats.length > 0) {
      main = readMainStat((await read('왼쪽 메인 옵션', await cropFromLeft(area, h, LIVE_REGIONS.enhanceMainStat))).text)
    }
  }
  return { subStats, main: subStats.length > 0 ? main : null, setId, panel, views }
}
