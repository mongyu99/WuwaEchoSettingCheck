// 강화 목표(최적화 계획 → 에코 체크): 빌드 체크의 목표 스탯 계산기에서 고른 계획을 에코 체크로 넘겨,
// 강화하는 동안 "이 자리 대신 쓸 에코는 이런 옵션이 붙어야 해요"를 단계별로 확인시켜 줍니다.
// 지금 끼고 있는 에코의 옵션은 바꿀 수 없어서, 조건에 맞는 새 에코를 띄워야 합니다.
import { getEchoCost } from './ocr'

const KEY = 'wuwa-enhance-mission'

/** 계획의 교체 단계 하나 → 새 에코가 갖춰야 할 조건. keep은 종류만(수치 무관), targets는 최소 수치까지. */
function stepToGoal(step, echo, validLabels) {
  // 여러 목표를 한 번에 푼 계획: 붙어야 할 옵션(targets)과 지킬 옵션(keep)이 이미 정해져 있습니다.
  if (step.targets && step.keep) {
    return {
      echoIndex: step.echoIndex,
      cost: Number(getEchoCost(echo)) || null,
      keep: step.keep.map((k) => ({ label: k.label, min: k.value })),
      targets: step.targets.map((tg) => ({ label: tg.label, min: tg.value })),
      probability: step.probability,
      attempts: step.attempts,
      done: false,
    }
  }
  const targets = [{ label: step.label, min: parseFloat(step.toValue) }]
  if (step.action === 'combo') targets.push({ label: step.flatLabel, min: parseFloat(step.flatToValue) })
  // 이번에 바뀌는 자리(무효 옵션 자리 · 다시 띄우는 옵션)를 뺀 나머지 유효 옵션은 새 에코에도 붙어 있어야 합니다.
  const changing = new Set([step.label, step.flatLabel, step.fromLabel, step.slotFromLabel].filter(Boolean))
  // 지킬 옵션은 지금 수치 이상으로 붙어야 합니다(다른 스탯이 떨어지지 않게).
  const keep = echo.subStats
    .filter((s) => s.label && s.valueText && validLabels.includes(s.label) && !s.free && !changing.has(s.label))
    .map((s) => ({ label: s.label, min: parseFloat(s.valueText) }))
  return {
    echoIndex: step.echoIndex,
    cost: Number(getEchoCost(echo)) || null,
    keep,
    targets,
    probability: step.probability,
    attempts: step.attempts,
    done: false,
  }
}

export function startMission({ character, category, steps, echoes, validLabels }) {
  const mission = {
    characterId: character.id,
    category,
    goals: steps.map((st) => stepToGoal(st, echoes[st.echoIndex], validLabels)),
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(mission))
  } catch {
    // 저장소를 못 쓰면 에코 체크에서 목표가 안 보일 뿐입니다.
  }
  return mission
}

export function loadMission() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

export function saveMission(mission) {
  try {
    if (mission) sessionStorage.setItem(KEY, JSON.stringify(mission))
    else sessionStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}

/**
 * 지금 인식한 에코가 목표를 얼마나 채웠는지. 옵션마다 'ok' | 'wait'(아직 안 열린 칸이 남음) | 'fail'.
 * 서브 옵션 5칸이 다 열렸는데 없으면 fail, 수치가 모자라면 fail입니다.
 */
export function checkGoal(goal, { cost, subStats }) {
  const subs = subStats ?? []
  const open = subs.length < 5
  const find = (label) => subs.find((s) => s.label === label)
  const costState = !cost ? 'wait' : Number(cost) === goal.cost ? 'ok' : 'fail'
  const keep = goal.keep.map((k) => {
    // 예전에 저장된 목표는 이름만 있어서(문자열) 수치 조건 없이 봅니다.
    const label = typeof k === 'string' ? k : k.label
    const min = typeof k === 'string' ? null : k.min
    const s = find(label)
    if (!s) return { label, min, state: open ? 'wait' : 'fail' }
    return { label, min, state: min === null || parseFloat(s.valueText) >= min - 1e-9 ? 'ok' : 'fail', got: s.valueText }
  })
  const targets = goal.targets.map((t) => {
    const s = find(t.label)
    if (!s) return { ...t, state: open ? 'wait' : 'fail' }
    return { ...t, state: parseFloat(s.valueText) >= t.min - 1e-9 ? 'ok' : 'fail', got: s.valueText }
  })
  const all = [costState, ...keep.map((k) => k.state), ...targets.map((t) => t.state)]
  return {
    costState,
    keep,
    targets,
    status: all.includes('fail') ? 'fail' : all.every((x) => x === 'ok') ? 'ok' : 'wait',
  }
}
