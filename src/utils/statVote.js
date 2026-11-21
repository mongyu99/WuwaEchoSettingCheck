/**
 * 실시간 인식 수치 안정화: 같은 에코를 여러 번 읽은 결과로 줄마다 다수결(최근 5번)하고,
 * 같은 값이 3번 연속 나오면 그 값으로 고정합니다. (예: 6.9를 가끔 6.3으로 잘못 읽어도 화면 값이 흔들리지 않게)
 * 메인 옵션이나 앞줄 옵션 구성이 바뀌면 다른 에코로 보고 기록을 비웁니다.
 */
export function createStatVoter() {
  let mainLabel = null
  let labels = []
  let rows = {} // 'i:label' → { history: [], locked }

  const stabilize = (found, foundMain) => {
    const nextLabels = found.map((s) => s.label)
    const sameEcho =
      (!foundMain || !mainLabel || foundMain.label === mainLabel) &&
      nextLabels.slice(0, Math.min(nextLabels.length, labels.length)).every((l, i) => l === labels[i])
    if (!sameEcho) rows = {}
    if (foundMain) mainLabel = foundMain.label
    if (!sameEcho || nextLabels.length >= labels.length) labels = nextLabels
    return found.map((s, i) => {
      const key = `${i}:${s.label}`
      const row = (rows[key] ??= { history: [], locked: null })
      if (row.locked) return { ...s, valueText: row.locked }
      row.history = [...row.history, s.valueText].slice(-5)
      const tail = row.history.slice(-3)
      if (tail.length === 3 && tail.every((x) => x === tail[0])) row.locked = tail[0]
      const counts = {}
      for (const x of row.history) counts[x] = (counts[x] ?? 0) + 1
      // 동점이면 가장 최근 값
      const best = [...row.history].reverse().reduce((b, x) => (counts[x] > counts[b] ? x : b))
      return { ...s, valueText: row.locked ?? best }
    })
  }

  const reset = () => {
    mainLabel = null
    labels = []
    rows = {}
  }

  return { stabilize, reset }
}
