import { describe, expect, it } from 'vitest'
import { parseDateTimeText } from './dateTimeText'

const now = new Date(2026, 10, 15)

describe('parseDateTimeText', () => {
  it.each([
    ['2026-11-12 10:00', '2026-11-12T10:00'],
    ['2026.11.12', '2026-11-12T00:00'],
    ['2026년 12월 3일 4시 59분', '2026-12-03T04:59'],
    ['202611121000', '2026-11-12T10:00'],
    ['20261203', '2026-12-03T00:00'],
    ['11/12 10:00', '2026-11-12T10:00'],
    ['12/21', '2026-12-21T00:00'],
    ['1221', '2026-12-21T00:00'],
    ['26.12.21 03:59', '2026-12-21T03:59'],
  ])('%s → %s', (text, expected) => {
    expect(parseDateTimeText(text, now)).toBe(expected)
  })

  it('읽을 수 없거나 없는 날짜는 null', () => {
    expect(parseDateTimeText('', now)).toBeNull()
    expect(parseDateTimeText('abc', now)).toBeNull()
    expect(parseDateTimeText('2026-13-40', now)).toBeNull()
    expect(parseDateTimeText('123', now)).toBeNull()
  })
})
