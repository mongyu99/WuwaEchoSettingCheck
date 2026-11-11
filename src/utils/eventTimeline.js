// 이벤트 노트(타임라인)의 날짜 계산입니다. 화면과 분리해 테스트할 수 있게 둡니다.
const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (time) => {
  const d = new Date(time)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * 타임라인에 그릴 범위와 막대 위치를 계산합니다.
 * 끝나지 않은 이벤트(진행 중 + 예정)만 그리고, 범위는 그중 가장 이른 시작일 ~ 가장 늦은 종료일입니다.
 * 반환: { start, end, days, rows: [{ event, left, width }], todayLeft } — left/width/todayLeft는 0~100(%)입니다.
 */
export function buildTimeline(events, now = Date.now()) {
  const active = events
    .filter((e) => new Date(e.endsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt) || new Date(a.endsAt) - new Date(b.endsAt))
  if (active.length === 0) return null

  const start = startOfDay(Math.min(...active.map((e) => new Date(e.startsAt).getTime())))
  const end = startOfDay(Math.max(...active.map((e) => new Date(e.endsAt).getTime()))) + DAY_MS
  const span = end - start
  const pct = (t) => ((t - start) / span) * 100

  return {
    start,
    end,
    days: Math.round(span / DAY_MS),
    rows: active.map((event) => {
      const left = pct(new Date(event.startsAt).getTime())
      return { event, left, width: Math.max(pct(new Date(event.endsAt).getTime()) - left, 0.5) }
    }),
    todayLeft: now >= start && now <= end ? pct(now) : null,
  }
}

/** 눈금으로 쓸 날짜들(범위 안의 매주 월요일 + 시작일)입니다. 반환: [{ time, left }] */
export function timelineTicks({ start, end }) {
  const ticks = [start]
  const d = new Date(start)
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
  for (let t = d.getTime(); t < end; t += 7 * DAY_MS) ticks.push(startOfDay(t))
  return ticks.map((time) => ({ time, left: ((time - start) / (end - start)) * 100 }))
}
