import { it } from 'vitest'
import { planJoint } from './jo.js'
import { SUB_STAT_OPTIONS } from '../config/subStatOptions'
import { writeFileSync } from 'node:fs'
let seed = 12345
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const pick = (a) => a[Math.floor(rnd() * a.length)]
const POOL = ['크리티컬%', '크리티컬 피해%', '공격력%', '공명 효율%', 'HP%', '방어력%', '공격력', 'HP', '방어력']
const valid = ['크리티컬%', '크리티컬 피해%', '공격력%', '공명 효율%', '공격력']
const echo = () => {
  const n = 5 - (rnd() < 0.15 ? 1 : 0)
  const labels = [...POOL].sort(() => rnd() - 0.5).slice(0, n)
  return { subStats: labels.map((l, i) => ({ id: 's' + i, label: l, valueText: String(pick(SUB_STAT_OPTIONS[l])) + (l.endsWith('%') ? '%' : '') })) }
}
const goal = (category, percentLabel, need, flatLabel = null, base = null) => ({ category, info: { percentLabel, flatLabel }, need, base })
it('all8', () => {
  globalThis.__PCT = 8; globalThis.__CAND = 200
  let bad = 0, total = 0, worst = 0, ms = 0, calls = 0
  const rows = []
  for (let t = 0; t < 1000; t++) {
    const echoes = Array.from({ length: 5 }, echo)
    const ng = 1 + Math.floor(rnd() * 3)
    const crit = 3 + Math.floor(rnd() * 16), er = 3 + Math.floor(rnd() * 12), cd = 8 + Math.floor(rnd() * 35), atk = 4 + Math.floor(rnd() * 20)
    const extra = [goal('공효', '공명 효율%', er), goal('크피', '크리티컬 피해%', cd), goal('공격력', '공격력%', atk, '공격력', 1000)].slice(0, ng - 1)
    const run = (c) => { const s = performance.now(); const r = planJoint({ goals: [goal('크리', '크리티컬%', c), ...extra], echoes, validLabels: valid }); ms += performance.now() - s; calls++; return r }
    const a = run(crit), b = run(crit - 1)
    rows.push([a.fast?.attempts ?? null, b.fast?.attempts ?? null])
    if (!a.fast || !b.fast) continue
    total++
    const ratio = b.fast.attempts / a.fast.attempts
    if (ratio > 1.01) { bad++; worst = Math.max(worst, ratio) }
  }
  writeFileSync('C:/Users/USER/AppData/Local/Temp/claude/0708f47b78ef133e/f220fa8e-764b-4282-a5e3-4c51c3687387/scratchpad/probe-all8.json', JSON.stringify({ name: 'all8', bad, total, worst, avgMs: ms / calls, rows }))
  console.log('RESULT all8 bad', bad, '/', total, 'worst', worst.toFixed(2), 'avgMs', (ms / calls).toFixed(0))
}, 3600000)
