import { createWorker } from 'tesseract.js'
import { STAT_WEIGHTS } from './scoreCalculator'
import { MAIN_STAT_BONUS_NAMES } from '../config/mainStatBonusNames'
import { SUB_STAT_OPTIONS, SUB_STAT_NAMES, formatSubStatValue } from '../config/subStatOptions'

/**
 * 두 문자열 사이의 편집 거리(레벤슈타인 거리)를 계산합니다. OCR로 심하게 깨진 라벨을
 * 알려진 후보 목록과 근접 비교해서 보정하는 데 씁니다.
 */
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

/** label과 가장 가까운 후보를 찾되, 후보 길이에 비해 너무 많이 다르면 매칭하지 않습니다. */
function closestMatch(label, candidates) {
  const stripped = label.replace(/\s+/g, '')
  let best = null
  let bestDist = Infinity
  for (const cand of candidates) {
    const candStripped = cand.replace(/\s+/g, '')
    const dist = levenshtein(stripped, candStripped)
    const threshold = Math.max(2, Math.ceil(candStripped.length * 0.4))
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist
      best = cand
    }
  }
  return best
}

/**
 * 메인 스탯은 항상 2줄입니다: 첫 줄은 코스트 보너스(15가지 중 하나), 둘째 줄은 실제
 * 주스탯인데 코스트 3 메아리 기준으로는 공격력 아니면 HP뿐입니다. 이 규칙을 이용해 OCR로
 * 깨진 라벨을 보정합니다.
 */
export function normalizeMainStats(mainStats) {
  return mainStats.map((s, idx) => {
    if (idx === 0) {
      const matched = closestMatch(s.label, MAIN_STAT_BONUS_NAMES)
      return matched ? { ...s, label: matched } : s
    }
    if (idx === 1) {
      const isAttack = closestMatch(s.label, ['공격력']) !== null
      return { ...s, label: isAttack ? '공격력' : 'HP' }
    }
    return s
  })
}

/**
 * 부옵션은 이제 자유 입력이 아니라 정해진 목록에서 클릭으로 고르는 방식입니다. OCR로 읽은
 * 라벨/값을 카탈로그(SUB_STAT_OPTIONS)에서 가장 가까운 조합으로 스냅합니다. 확신이 안 서면
 * (매칭 실패) 빈 값으로 두어 사용자가 드롭다운에서 직접 고르게 합니다.
 */
export function snapSubStatsToCatalog(subStats) {
  return subStats.map((s) => {
    const isPercent = s.valueText.includes('%')
    const base = s.label.replace(/%/g, '').trim()
    const pool = SUB_STAT_NAMES.filter((n) => n.endsWith('%') === isPercent)
    const poolBase = pool.map((n) => n.replace(/%$/, ''))
    const matchedBase = closestMatch(base, poolBase)
    const label = matchedBase ? pool[poolBase.indexOf(matchedBase)] : ''

    if (!label) {
      return { ...s, label: '', valueText: '' }
    }

    const rawNum = parseFloat(s.valueText)
    const options = SUB_STAT_OPTIONS[label]
    let nearest = options[0]
    if (!Number.isNaN(rawNum)) {
      let bestDiff = Math.abs(options[0] - rawNum)
      for (const v of options) {
        const diff = Math.abs(v - rawNum)
        if (diff < bestDiff) {
          bestDiff = diff
          nearest = v
        }
      }
    }

    return { ...s, label, valueText: formatSubStatValue(label, nearest) }
  })
}

/**
 * 알려진 스탯명(STAT_WEIGHTS)의 공백을 제거한 형태 -> 정식 표기 매핑.
 * OCR마다 띄어쓰기가 들쭉날쭉("공명효율" vs "공명 효율")한 걸 정식 표기로 맞춥니다.
 */
const CANONICAL_LABELS = Object.keys(STAT_WEIGHTS).reduce((acc, key) => {
  acc[key.replace(/\s+/g, '')] = key
  return acc
}, {})

function normalizeLabelSpacing(label) {
  const stripped = label.replace(/\s+/g, '')
  return CANONICAL_LABELS[stripped] ?? label
}

/**
 * 한글/영어/숫자와 최소한의 기호(%, ., -, /, 공백)만 남기고
 * 아이콘이 잘못 인식되어 섞여 들어온 특수문자를 전부 제거합니다.
 */
function sanitizeText(str) {
  return str
    .replace(/[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ%.\-/\s]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

const NUMERIC_TOKEN = /^[+-]?\d+(?:\.\d+)?%?$/
const SINGLE_LATIN_LETTER = /^[A-Za-z]$/
const HAS_ALNUM_OR_HANGUL = /[0-9A-Za-z가-힣]/

/**
 * 한 줄을 토큰 단위로 나눠, 아이콘이 문자로 잘못 인식된 흔적(낱개 영문자, 의미 없는
 * 기호 조각 등)을 제거합니다. 예: "-. 공격력" -> "공격력", "HP i" -> "HP"
 */
function cleanLine(line) {
  const tokens = sanitizeText(line).split(' ').filter(Boolean)
  const kept = tokens.filter((tok) => {
    if (NUMERIC_TOKEN.test(tok)) return true
    if (SINGLE_LATIN_LETTER.test(tok)) return false
    if (!HAS_ALNUM_OR_HANGUL.test(tok)) return false
    return true
  })
  return kept.join(' ')
}

/**
 * OCR이 라벨과 수치를 서로 다른 줄로 쪼개 인식했을 때(예: "HP" 다음 줄에 "112"만
 * 단독으로 잡히는 경우), 숫자만 있는 줄을 바로 앞의 라벨 줄에 붙여 하나의 스탯으로
 * 합칩니다.
 */
function mergeOrphanValues(lines) {
  const merged = []
  for (const line of lines) {
    const isNumericOnly = NUMERIC_TOKEN.test(line)
    const prev = merged[merged.length - 1]
    if (isNumericOnly && prev && !/\d/.test(prev)) {
      merged[merged.length - 1] = `${prev} ${line}`
      continue
    }
    merged.push(line)
  }
  return merged
}

const STAT_LINE_PATTERN = /^(.+?)\s+([+-]?\d+(?:\.\d+)?)\s*(%?)$/

/**
 * 이 게임의 서브/메인 스탯은 규칙이 명확합니다: %가 붙는 값은 항상 소수점 한 자리까지
 * 표기됩니다(예: 7.1%). 반대로 소수점이 있는 값은 예외 없이 % 값입니다. 이 규칙을 이용해
 * OCR이 소수점이나 %를 놓친 경우를 보정합니다.
 * - 소수점이 찍혀 있으면(예: "12.6") %가 안 읽혔어도 무조건 % 값으로 처리
 * - %는 읽혔는데 소수점이 없으면(예: "71%") 마지막 한 자리를 소수점으로 보정 (71 -> 7.1)
 *
 * 값은 숫자+플래그가 아니라 화면/입력창에 그대로 넣는 문자열(valueText)로 반환합니다.
 * 사용자가 "%"를 직접 붙이거나 지울 수 있어야 하기 때문입니다.
 */
function parseSingleStat(cleanText, id) {
  const match = cleanText.match(STAT_LINE_PATTERN)
  if (match) {
    const [, rawLabel, rawValue, percentSign] = match
    const hasDecimalPoint = rawValue.includes('.')
    let value = parseFloat(rawValue)
    let isPercent = percentSign === '%'

    if (hasDecimalPoint) {
      isPercent = true
    } else if (isPercent && value >= 10) {
      value = value / 10
    }

    return {
      id,
      label: normalizeLabelSpacing(rawLabel.trim()),
      valueText: isPercent ? `${value}%` : `${value}`,
      raw: cleanText,
    }
  }
  return { id, label: normalizeLabelSpacing(cleanText), valueText: '', raw: cleanText }
}

/**
 * 크롭된 이미지(Blob 또는 dataURL)에서 텍스트와 줄 단위 위치 정보를 추출합니다.
 * @param {string|Blob} image - 인식할 이미지
 * @param {(progress: number) => void} onProgress - 0~1 진행률 콜백
 * @returns {Promise<{text: string, lines: {text: string, bbox: object}[]}>}
 */
export async function recognizeRegion(image, onProgress) {
  const worker = await createWorker('kor+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress)
      }
    },
  })

  try {
    const { data } = await worker.recognize(image)
    const lines = (data.lines ?? []).map((l) => ({ text: l.text, bbox: l.bbox }))
    return { text: data.text, lines }
  } finally {
    await worker.terminate()
  }
}

/** 기존 호출부와의 호환을 위한 텍스트 전용 버전 */
export async function extractText(image, onProgress) {
  const { text } = await recognizeRegion(image, onProgress)
  return text
}

/**
 * OCR 원문(텍스트만)에서 "스탯명 + 수치" 패턴을 파싱합니다. 메인 스탯처럼
 * 줄 위치(bbox)가 필요 없는 경우에 사용합니다. %가 붙어있으면 isPercent: true로
 * 표시되어 화면에도 %가 그대로 유지됩니다.
 */
export function parseStatLines(rawText) {
  const cleaned = rawText.split('\n').map(cleanLine).filter(Boolean)
  const merged = mergeOrphanValues(cleaned)
  return merged.map((line, idx) => parseSingleStat(line, `stat-${idx}`))
}

/**
 * Tesseract의 줄 단위 결과(lines, bbox 포함)를 받아 스탯으로 파싱하면서,
 * 하이라이트 판별에 쓸 수 있도록 파싱에 실제로 사용된 원본 줄(kept, bbox 포함)도
 * 함께 반환합니다. stats와 kept는 인덱스가 항상 1:1로 대응합니다. 라벨과 수치가
 * 서로 다른 줄로 인식된 경우 앞 줄의 bbox를 그대로 사용합니다.
 */
export function buildStatsFromLines(lineObjs) {
  const cleaned = lineObjs
    .map((l) => ({ text: cleanLine(l.text), bbox: l.bbox }))
    .filter((l) => l.text)

  const merged = []
  for (const l of cleaned) {
    const isNumericOnly = NUMERIC_TOKEN.test(l.text)
    const prev = merged[merged.length - 1]
    if (isNumericOnly && prev && !/\d/.test(prev.text)) {
      prev.text = `${prev.text} ${l.text}`
      continue
    }
    merged.push({ ...l })
  }

  const stats = merged.map((l, idx) => parseSingleStat(l.text, `stat-${idx}`))
  return { stats, kept: merged }
}
