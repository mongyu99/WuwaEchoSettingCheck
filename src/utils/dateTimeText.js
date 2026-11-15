// 관리자 화면의 일시 칸에 붙여넣은 글자(숫자)를 datetime-local 형식(YYYY-MM-DDTHH:mm)으로 바꿉니다.
const pad = (n) => String(n).padStart(2, '0')

/** 숫자만 이어 붙인 값을 [년, 월, 일, 시, 분] 조각으로 나눕니다. */
function splitDigits(d) {
  if (d.length === 12) return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8), d.slice(8, 10), d.slice(10, 12)] // 202611121000
  if (d.length === 8) return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)] // 20261112
  if (d.length === 10) return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 6), d.slice(6, 8), d.slice(8, 10)] // 2611121000 → 26년
  if (d.length === 6) return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 6)] // 261112
  if (d.length === 4) return [null, d.slice(0, 2), d.slice(2, 4)] // 1112 → 올해 11월 12일
  return null
}

/**
 * 예: '2026-11-12 10:00', '2026.11.12', '11/12 10:00', '202611121000', '1112'.
 * 연도가 없으면 올해, 시각이 없으면 00:00. 못 읽으면 null.
 */
export function parseDateTimeText(text, now = new Date()) {
  const groups = String(text ?? '').match(/\d+/g)
  if (!groups) return null
  let parts
  if (groups.length === 1) parts = splitDigits(groups[0])
  else if (groups[0].length >= 4 || groups.length === 3 || groups.length === 5) parts = groups // 년 월 일 [시 분]
  else parts = [null, ...groups] // 월 일 [시 분]
  if (!parts || parts.length < 3) return null

  let [y, mo, day, h = 0, mi = 0] = parts
  y = y === null ? now.getFullYear() : Number(y)
  if (y < 100) y += 2000
  mo = Number(mo)
  day = Number(day)
  h = Number(h)
  mi = Number(mi)
  const date = new Date(y, mo - 1, day, h, mi)
  // 13월 32일처럼 넘친 값은 날짜가 밀려 버리므로 거부합니다.
  if (date.getMonth() !== mo - 1 || date.getDate() !== day || h > 23 || mi > 59) return null
  return `${y}-${pad(mo)}-${pad(day)}T${pad(h)}:${pad(mi)}`
}
