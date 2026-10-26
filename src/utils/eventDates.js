const DAY_MS = 24 * 60 * 60 * 1000

export function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 2026-10-30 → 10.30 (같은 해 일정을 짧게 보여줄 때) */
export function formatMonthDay(iso) {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 남은 일수는 "오늘부터 종료일까지 며칠 남았는지"를 보여주는 용도라 초 단위 실시간 카운트다운
// 대신 날짜 단위로만 올림해서 계산합니다(예: 23시간 남아도 D-1로 표시). 끝났으면 null.
export function daysRemaining(endsAt) {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return null
  return Math.ceil(ms / DAY_MS)
}
