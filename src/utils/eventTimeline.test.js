import { describe, expect, it } from 'vitest'
import { buildTimeline, timelineTicks } from './eventTimeline'

const at = (s) => new Date(s).getTime()
const ev = (id, startsAt, endsAt) => ({ id, title: id, startsAt, endsAt })

describe('buildTimeline', () => {
  const now = at('2026-11-10T12:00:00')
  const events = [
    ev('past', '2026-10-01T00:00:00', '2026-10-20T00:00:00'),
    ev('b', '2026-11-05T00:00:00', '2026-11-15T00:00:00'),
    ev('a', '2026-11-01T00:00:00', '2026-11-30T23:59:00'),
  ]

  it('끝난 이벤트는 빼고, 시작일 순으로 줄을 세운다', () => {
    expect(buildTimeline(events, now).rows.map((r) => r.event.id)).toEqual(['a', 'b'])
  })

  it('범위는 가장 이른 시작일 0시 ~ 가장 늦은 종료일 다음 날 0시', () => {
    const t = buildTimeline(events, now)
    expect(t.start).toBe(at('2026-11-01T00:00:00'))
    expect(t.end).toBe(at('2026-12-01T00:00:00'))
    expect(t.days).toBe(30)
  })

  it('막대 위치와 오늘 선을 %로 준다', () => {
    const t = buildTimeline(events, now)
    expect(t.rows[0].left).toBe(0)
    expect(t.rows[1].left).toBeCloseTo((4 / 30) * 100, 5)
    expect(t.todayLeft).toBeCloseTo((9.5 / 30) * 100, 5)
  })

  it('진행 중·예정 이벤트가 없으면 null', () => {
    expect(buildTimeline([events[0]], now)).toBeNull()
  })
})

describe('timelineTicks', () => {
  it('시작일과 그 뒤 매주 월요일에 눈금을 둔다', () => {
    // 2026-11-01은 일요일 → 다음 월요일은 11-02, 11-09, ...
    const ticks = timelineTicks({ start: at('2026-11-01T00:00:00'), end: at('2026-11-20T00:00:00') })
    expect(ticks.map((t) => new Date(t.time).getDate())).toEqual([1, 2, 9, 16])
    expect(ticks[0].left).toBe(0)
  })
})
