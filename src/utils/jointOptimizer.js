// 목표 스탯 계산기 — 여러 목표를 한 번에 채우는 계획.
// 목표마다 따로 계산하면 같은 에코 자리를 서로 다르게 바꾸라고 하거나(에코는 하나뿐), 한쪽이 다른 쪽 옵션을
// 빼 버리는 계획이 나옵니다. 여기서는 에코마다 "새 에코에 무엇이 붙어야 하는지"를 모든 목표 기준으로 정하고,
// 에코 5개를 어떻게 바꾸면 모든 목표가 동시에 채워지는지 찾습니다.
//
// - 에코 하나를 바꾸는 방법(후보): 목표 옵션을 더 높은 단계로 다시 띄우기(upgrade), 빈 자리·무효 자리에 목표 옵션
//   붙이기(add), 깡 수치 붙이기. 여러 목표 옵션을 한 에코에 같이 붙이는 것도 후보입니다.
// - 새 에코는 지금 붙은 다른 유효 옵션이 지금 수치 이상으로 다시 붙어야 합니다(다른 스탯이 안 떨어지게).
// - 단계는 경우의 수를 줄이려고 대표 단계 몇 개만 봅니다(정확한 최적이 아니라 근사).
// - 조합 찾기는 에코를 하나씩 넘기며 좋은 중간 결과만 남기는 방식(빔 탐색)입니다.
import { SUB_STAT_OPTIONS } from '../config/subStatOptions'
import { echoMultiTargetProbability, expectedAttempts } from './probability'

const PCT_TIERS = 3 // 퍼센트 옵션 대표 단계 수
const FLAT_TIERS = 2 // 깡 옵션 대표 단계 수
const MAX_CANDIDATES_PER_ECHO = 80
const BEAM = 600

/** 단계 목록에서 대표 단계 n개(낮은 단계 쪽은 건너뛰고 고르게)를 고릅니다. */
function pickTiers(tiers, n) {
  if (tiers.length <= n) return tiers
  const out = []
  for (let i = 1; i <= n; i++) out.push(tiers[Math.round((i * (tiers.length - 1)) / n)])
  return [...new Set(out)]
}

const fmtValue = (label, v) => (label.endsWith('%') ? `${v}%` : `${v}`)

/**
 * 목표(goal) 하나에 대해 이 에코에서 할 수 있는 선택들. none(안 건드림) 포함.
 * 선택마다: 쓰는 자리 수(slots), 이 목표 증가량(gain, % 단위), 새 에코에 붙어야 할 조건(targets), 바뀌는 내용(changes), 다시 띄우는 기존 옵션(upgraded)
 */
function goalOptions(goal, subs, allow) {
  const { info, base } = goal
  const opts = [{ slots: 0, gain: 0, targets: [], changes: [], upgraded: null }]
  const pctStat = subs.find((s) => s.label === info.percentLabel)
  const pctTiers = pickTiers(SUB_STAT_OPTIONS[info.percentLabel] ?? [], PCT_TIERS)
  const pctOpts = []
  if (allow.percent) {
    if (pctStat) {
      const cur = parseFloat(pctStat.valueText)
      for (const t of pctTiers.filter((v) => v > cur)) {
        pctOpts.push({
          slots: 0,
          gain: t - cur,
          targets: [{ label: info.percentLabel, value: t }],
          changes: [{ kind: 'upgrade', label: info.percentLabel, from: pctStat.valueText, to: fmtValue(info.percentLabel, t) }],
          upgraded: pctStat,
        })
      }
    } else {
      for (const t of pctTiers) {
        pctOpts.push({
          slots: 1,
          gain: t,
          targets: [{ label: info.percentLabel, value: t }],
          changes: [{ kind: 'add', label: info.percentLabel, to: fmtValue(info.percentLabel, t) }],
          upgraded: null,
        })
      }
    }
  }
  opts.push(...pctOpts)
  const canFlat = allow.flat && info.flatLabel && base > 0 && !subs.some((s) => s.label === info.flatLabel)
  if (canFlat) {
    const flatTiers = pickTiers(SUB_STAT_OPTIONS[info.flatLabel] ?? [], FLAT_TIERS)
    for (const f of flatTiers) {
      const flatOpt = {
        slots: 1,
        gain: (f / base) * 100,
        targets: [{ label: info.flatLabel, value: f }],
        changes: [{ kind: 'add', label: info.flatLabel, to: fmtValue(info.flatLabel, f) }],
        upgraded: null,
      }
      opts.push(flatOpt)
      // %와 깡을 한 에코에 같이(섞어서)
      if (allow.percent && allow.flat) {
        for (const p of pctOpts) {
          opts.push({
            slots: p.slots + 1,
            gain: p.gain + flatOpt.gain,
            targets: [...p.targets, ...flatOpt.targets],
            changes: [...p.changes, ...flatOpt.changes],
            upgraded: p.upgraded,
          })
        }
      }
    }
  }
  return opts
}

/** 에코 하나를 바꾸는 후보들(모든 목표 조합). gains는 목표 순서대로의 증가량(% 단위). */
function echoCandidates(echo, echoIndex, goals, validLabels, allow) {
  const subs = echo.subStats.filter((s) => s.label && s.valueText)
  const empty = Math.max(0, 5 - subs.length)
  // 바꿔도 되는 자리: 무효 옵션 먼저, 그다음 목표를 넘친 몫(free)
  const freeSlots = subs
    .filter((s) => !validLabels.includes(s.label) || s.free)
    .sort((a, b) => Number(validLabels.includes(a.label)) - Number(validLabels.includes(b.label)))
  const capacity = empty + freeSlots.length
  const perGoal = goals.map((g) => goalOptions(g, subs, allow))

  const out = []
  const walk = (gi, acc) => {
    if (acc.slots > capacity) return
    if (gi === goals.length) {
      if (acc.changes.length === 0) return
      // 쓰는 자리: 빈 자리부터, 모자라면 바꿔도 되는 자리(무효 → 넘친 몫 순)
      const replaced = freeSlots.slice(0, Math.max(0, acc.slots - empty))
      const changes = []
      let r = 0
      for (const ch of acc.changes) {
        if (ch.kind === 'add' && changes.filter((c) => c.kind === 'add').length >= empty) {
          const from = replaced[r++]
          changes.push({ ...ch, kind: 'replace', fromLabel: from?.label, fromValue: from?.valueText })
        } else changes.push(ch)
      }
      // 지켜야 할 옵션: 유효하고, 넘친 몫이 아니고, 다시 띄우지도 바꾸지도 않는 옵션 → 지금 수치 이상
      const keep = subs
        .filter((s) => validLabels.includes(s.label) && !s.free && !acc.upgraded.includes(s) && !replaced.includes(s))
        .map((s) => ({ label: s.label, value: parseFloat(s.valueText) }))
      const probability = echoMultiTargetProbability(0, [...keep, ...acc.targets])
      if (!(probability > 0)) return
      out.push({
        echoIndex,
        changes,
        targets: acc.targets,
        keep,
        gains: acc.gains,
        probability,
        attempts: expectedAttempts(probability),
      })
      return
    }
    for (const opt of perGoal[gi]) {
      walk(gi + 1, {
        slots: acc.slots + opt.slots,
        targets: [...acc.targets, ...opt.targets],
        changes: [...acc.changes, ...opt.changes],
        upgraded: opt.upgraded ? [...acc.upgraded, opt.upgraded] : acc.upgraded,
        gains: [...acc.gains, opt.gain],
      })
    }
  }
  walk(0, { slots: 0, targets: [], changes: [], upgraded: [], gains: [] })

  // 모든 목표에서 같거나 더 오르면서 시도 횟수도 같거나 적은 후보가 있으면 뺍니다.
  // 시도 횟수 적은 순으로 보면서, 이미 남긴 후보 중 하나가 모든 목표에서 같거나 더 오르면 뺍니다(빠른 가지치기).
  out.sort((a, b) => a.attempts - b.attempts)
  const kept = []
  for (const c of out) {
    if (kept.some((o) => o.gains.every((g, i) => g >= c.gains[i] - 1e-9))) continue
    kept.push(c)
    if (kept.length >= MAX_CANDIDATES_PER_ECHO) break
  }
  return kept
}

/** 에코를 하나씩 넘기며 좋은 조합만 남겨, 모든 목표를 채우는 가장 좋은 계획을 찾습니다. */
function beamSearch(perEcho, needs, better) {
  const deficit = (gains) => gains.reduce((sum, g, i) => sum + Math.max(0, needs[i] - g) / needs[i], 0)
  let states = [{ gains: needs.map(() => 0), attempts: 0, minProbability: Infinity, steps: [] }]
  for (const cands of perEcho) {
    const next = []
    for (const s of states) {
      next.push(s)
      for (const c of cands) {
        next.push({
          gains: s.gains.map((g, i) => g + c.gains[i]),
          attempts: s.attempts + c.attempts,
          minProbability: Math.min(s.minProbability, c.probability),
          steps: [...s.steps, c],
        })
      }
    }
    // 목표를 넘친 증가량은 같은 걸로 보고(목표에서 자름) 같은 상태끼리는 더 좋은 하나만 남깁니다.
    const byKey = new Map()
    for (const s of next) {
      const key = s.gains.map((g, i) => Math.min(g, needs[i]).toFixed(1)).join('|')
      const prev = byKey.get(key)
      if (!prev || better(s, prev)) byKey.set(key, s)
    }
    states = [...byKey.values()]
      .sort((a, b) => deficit(a.gains) - deficit(b.gains) || (better(a, b) ? -1 : better(b, a) ? 1 : 0))
      .slice(0, BEAM)
  }
  const done = states.filter((s) => deficit(s.gains) < 1e-9)
  if (done.length === 0) return null
  return done.reduce((best, s) => (better(s, best) ? s : best))
}

const fastBetter = (a, b) => a.attempts < b.attempts - 1e-9 || (Math.abs(a.attempts - b.attempts) < 1e-9 && a.minProbability > b.minProbability)
const safeBetter = (a, b) =>
  a.minProbability > b.minProbability + 1e-12 || (Math.abs(a.minProbability - b.minProbability) < 1e-12 && a.attempts < b.attempts)

/**
 * goals: [{ category, info: { percentLabel, flatLabel? }, need(% 단위), base(기준값, 공격력·HP·방어력만) }]
 * 반환: { fast, safe, strategies: { minmax, flat, mixed } } — 각 계획은 { steps, attempts, minProbability, gains } 또는 null
 */
export function planJoint({ goals, echoes, validLabels }) {
  if (goals.length === 0) return { fast: null, safe: null, strategies: {} }
  const needs = goals.map((g) => g.need)
  const solve = (allow) => {
    const perEcho = echoes.map((e, i) => echoCandidates(e, i, goals, validLabels, allow)).filter((c) => c.length > 0)
    const fast = beamSearch(perEcho, needs, fastBetter)
    const safe = beamSearch(perEcho, needs, safeBetter)
    return { fast, safe }
  }
  const hasFlat = goals.some((g) => g.info.flatLabel && g.base > 0)
  const strategies = {
    minmax: solve({ percent: true, flat: false }),
    ...(hasFlat ? { flat: solve({ percent: false, flat: true }) } : {}),
    mixed: solve({ percent: true, flat: true }),
  }
  return { fast: strategies.mixed.fast, safe: strategies.mixed.safe, strategies }
}
