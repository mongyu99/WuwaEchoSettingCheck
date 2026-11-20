// 가방 화면 맨 위 에코 이름(예: "공명의 메아리 · 명식 · 레비아탄")을 메인 에코 목록과 맞춰 id를 찾습니다.
// 캐릭터 추천에서 메인 에코 자리를 고정하는 데 씁니다. 목록에 없는 일반 에코는 null입니다.
import { MAIN_ECHOES } from '../config/mainEchoes'

// 비교할 때는 띄어쓰기·가운뎃점·기호를 빼고 한글만 봅니다(OCR이 "·"를 "ㆍ", "."로 읽는 등 들쭉날쭉해서).
const normalize = (text) => (text ?? '').replace(/[^가-힣]/g, '')

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
  return dp[a.length][b.length]
}

/**
 * OCR로 읽은 이름 글자에서 메인 에코 id를 찾습니다.
 * "악몽 · 크라운리스"와 "크라운리스"처럼 한 끗 차이 이름이 있어서, 이름 길이의 25% 이내로 다를 때만 인정합니다.
 */
export function matchMainEchoName(ocrText) {
  const raw = normalize(ocrText)
  if (raw.length < 2) return null
  // 게임은 일부 에코 이름 앞에 "이상 ·"을 붙여 보여 줍니다(예: "이상 · 무망자"). 목록 이름에는 없어서 떼고도 비교합니다.
  const reads = raw.startsWith('이상') ? [raw, raw.slice(2)] : [raw]
  let best = null
  let bestDist = Infinity
  for (const [id, echo] of Object.entries(MAIN_ECHOES)) {
    const name = normalize(echo.name)
    // 이름 뒤에 OCR 잡음 글자가 붙는 경우가 있어서, 이름 길이만큼 앞부분만 잘라 비교한 값도 봅니다.
    const dist = Math.min(...reads.flatMap((read) => [editDistance(read, name), editDistance(read.slice(0, name.length), name)]))
    if (dist <= Math.max(1, Math.floor(name.length * 0.25)) && dist < bestDist) {
      best = id
      bestDist = dist
    }
  }
  return best
}
