import { expect, it } from 'vitest'
import { snapSubStatsToCatalog } from './ocr'
it('앞자리 1이 빠진 값 복원', () => {
  const r = snapSubStatsToCatalog([{ id: 'a', label: 'HP', valueText: '1.6%' }, { id: 'b', label: '크리티컬', valueText: '6.9%' }, { id: 'c', label: '공격력', valueText: '50' }])
  expect(r.map((s) => s.valueText)).toEqual(['11.6%', '6.9%', '50'])
})
