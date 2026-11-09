import { useEffect, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import { screenCaptureSupported, findGameArea } from '../components/ScreenCapture'
import '../components/EchoPanel.css'
import { CHARACTERS } from '../config/characters'
import { getValidOptions } from '../config/characterValidOptions'
import { getCharacterEchoCombos } from '../config/characterEchoSets'
import { ECHO_SETS, getEchoSet } from '../config/echoSets'
import { FIXED_REGIONS, LIVE_REGIONS } from '../config/regions'
import { blobToDataURL, cropNormalizedImage, normalizeImage, preprocessForOcr } from '../utils/image'
import { MAIN_STAT_VALUES, applyCostToMainStats } from '../config/echoMainStats'
import { buildStatsFromLines, closestMatch, createOcrSession, getEchoCost, normalizeMainStats, parseStatLines, snapSubStatsToCatalog } from '../utils/ocr'
import { SUB_STAT_NAMES, SUB_STAT_OPTIONS, formatSubStatValue } from '../config/subStatOptions'
import { scoreValidStats } from '../utils/echoScore'
import { exactRollProbability, optionSetProbability, successProbability, targetRollProbability, tierProbability } from '../utils/probability'
import { panelSignature, signatureChanged } from '../utils/screenWatch'
import '../components/ScreenCapture.css'
import './LiveEchoCheckPage.css'

const CHECK_INTERVAL_MS = 500
const MAX_TOTAL_COST = 12
const TOP_COUNT = 5
/** 게임 화면을 높이 1080 기준으로 보고, 왼쪽 끝 기준 좌표의 영역을 잘라 냅니다(강화 화면용). */
function cropFromLeft(source, h, region) {
  const scale = h / 1080
  // 공유 화면은 글자가 작아서 2배로 키워 인식합니다.
  const canvas = document.createElement('canvas')
  canvas.width = region.width * 2
  canvas.height = region.height * 2
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, region.x * scale, region.y * scale, region.width * scale, region.height * scale, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

// 수치가 없는 줄은 배경 잡음이나 잠긴 옵션 줄입니다. 그대로 두면 짧은 잡음이 "HP"에 맞춰져 최저 수치로 채워집니다.
const readSubStats = (lines) =>
  snapSubStatsToCatalog(
    buildStatsFromLines(lines)
      .stats.filter((s) => s.valueText)
      .slice(0, 5),
  ).filter((s) => s.label && s.valueText)

/** 화음 이펙트 영역의 줄들에서 세트 이름을 찾습니다. "(2/2)" 같은 표시와 기호는 빼고 세트 목록과 대조합니다. */
function findSetId(lines) {
  const names = Object.values(ECHO_SETS).map((set) => set.name)
  for (const line of lines) {
    const name = closestMatch(line.text.replace(/\(.*$/, '').replace(/[^가-힣\s]/g, '').trim(), names)
    if (name) return Object.keys(ECHO_SETS).find((id) => ECHO_SETS[id].name === name)
  }
  return null
}

/** 메인 옵션 첫 줄(% 수치)만 씁니다. 둘째 줄은 코스트로 고정된 플랫이라 비교할 필요가 없습니다. */
const readMainStat = (text) => {
  const stat = normalizeMainStats(parseStatLines(text))[0]
  return stat?.label && stat.valueText?.includes('%') ? { label: stat.label, valueText: stat.valueText } : null
}

const usesSet = (characterId, setId) =>
  !!setId && (getCharacterEchoCombos(characterId) ?? []).some((combo) => combo.some((part) => part.setId === setId))

/** 세트가 맞는 캐릭터를 먼저, 그다음 메인 옵션이 유효한 캐릭터, 그 안에서는 유효 점수가 높은 순으로 보여줍니다. */
function recommend(subStats, setId, mainLabel) {
  // 속성 피해 메인은 같은 속성 캐릭터에게만 쓸모가 있습니다.
  const mainElement = mainLabel?.endsWith(' 피해 보너스') ? mainLabel.replace(' 피해 보너스', '') : null
  return CHARACTERS.filter((c) => !c.upcoming && (!mainElement || c.element === mainElement))
    .map((character) => ({
      character,
      setMatched: usesSet(character.id, setId),
      mainMatched: !!mainLabel && getValidOptions(character.id).includes(`${mainLabel}%`),
      ...scoreValidStats(subStats, getValidOptions(character.id)),
    }))
    .sort((a, b) => b.setMatched - a.setMatched || b.mainMatched - a.mainMatched || b.total - a.total)
    .slice(0, TOP_COUNT)
}

/** 메인 옵션의 이름과 수치가 일치하는 코스트를 찾습니다. 강화 중이거나 잘못 읽었으면 찾지 못합니다. */
function costOfMain(main) {
  if (!main) return null
  if (main.cost) return main.cost
  return Object.keys(MAIN_STAT_VALUES).find((cost) => MAIN_STAT_VALUES[cost][main.label] === main.valueText) ?? null
}

function buildEcho(main, subStats, chosenCost) {
  const cost = chosenCost || costOfMain(main)
  return {
    id: `live-${Date.now()}`,
    previewUrl: null,
    cost,
    mainStats: cost ? applyCostToMainStats([], cost, main?.label) : [],
    subStats: subStats.map((s, i) => ({ id: `stat-${i}`, label: s.label, valueText: s.valueText })),
    failed: false,
  }
}

/** 교체 확인 팝업의 한쪽 칸: 에코의 유효 점수와 옵션을 보여줍니다. */
function EchoCompareColumn({ title, echo, characterId }) {
  const { total } = scoreValidStats(echo.subStats, getValidOptions(characterId))
  return (
    <div className="live-check__compare-col">
      <h4>{title}</h4>
      <strong>{total.toFixed(1)}점</strong>
      <ul>
        {echo.mainStats.filter((stat) => stat.label).map((stat) => (
          <li key={`main-${stat.id}`} className="live-check__compare-main">
            <span>{stat.label}</span>
            <b>{stat.valueText}</b>
          </li>
        ))}
        {echo.subStats.filter((stat) => stat.label).map((stat) => (
          <li key={stat.id}>
            <span>{stat.label}</span>
            <b>{stat.valueText}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 확률(%)을 "0.12% · 약 N개 중 1개"로 씁니다. 아주 작은 값은 지수 표기로 줄입니다. */
function formatOdds(percent) {
  const shown = percent < 0.01 ? percent.toExponential(1) : percent.toFixed(2)
  return `${shown}% · 약 ${Math.round(100 / percent).toLocaleString()}개 중 1개`
}

/** 지금 서브 옵션이 종류와 수치까지 그대로 뜰 확률입니다. */
function RollOdds({ stats }) {
  const percent = exactRollProbability(stats)
  if (!percent) return null
  return (
    <p className="live-check__odds">
      이 옵션이 그대로 뜰 확률 <strong>{formatOdds(percent)}</strong>
    </p>
  )
}

const MAX_TARGETS = 5

/** 원하는 옵션(최대 5개)과 최소 수치를 골라, 그런 에코가 뜰 확률을 계산합니다. 화면 인식과는 따로 동작합니다. */
/** 원하는 옵션이 지금 에코에 (최소 수치 이상으로) 떠 있는지 봅니다. */
const targetHit = (target, stats) =>
  (stats ?? []).some((s) => s.label === target.label && (!target.minValue || parseFloat(s.valueText) >= target.minValue))

function TargetOdds({ targets, setTargets, stats }) {
  const allHit = targets.length > 0 && targets.every((t) => targetHit(t, stats))
  const toggle = (label) =>
    setTargets((list) =>
      list.some((t) => t.label === label)
        ? list.filter((t) => t.label !== label)
        : list.length < MAX_TARGETS
          ? [...list, { label, minValue: null }]
          : list,
    )
  const setMin = (label, minValue) =>
    setTargets((list) => list.map((t) => (t.label === label ? { ...t, minValue } : t)))
  const percent = targetRollProbability(targets)

  return (
    <div className="live-check__target">
      <h3>원하는 옵션 ({targets.length}/{MAX_TARGETS})</h3>
      {allHit && <p className="live-check__target-hit">원하는 옵션이 모두 떴어요!</p>}
      <div className="live-check__target-chips">
        {SUB_STAT_NAMES.map((name) => {
          const on = targets.some((t) => t.label === name)
          return (
            <button
              key={name}
              type="button"
              className={`live-check__chip ${on ? 'live-check__chip--on' : ''}`}
              disabled={!on && targets.length >= MAX_TARGETS}
              onClick={() => toggle(name)}
            >
              {name}
            </button>
          )
        })}
      </div>
      {targets.length > 0 && (
        <>
          <ul className="live-check__sub-rows">
            {targets.map((t) => (
              <li key={t.label} className={targetHit(t, stats) ? 'live-check__target--hit' : ''}>
                <span>
                  {targetHit(t, stats) ? '✓ ' : ''}
                  {t.label}
                </span>
                <select
                  className="live-check__select"
                  aria-label={`${t.label} 최소 수치`}
                  value={t.minValue ?? ''}
                  onChange={(e) => setMin(t.label, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">수치 무관</option>
                  {(SUB_STAT_OPTIONS[t.label] ?? []).map((value) => (
                    <option key={value} value={value}>
                      {formatSubStatValue(t.label, value)} 이상
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          <p className="live-check__odds">
            이 옵션이 뜰 확률 <strong>{formatOdds(percent)}</strong>
          </p>
        </>
      )}
    </div>
  )
}

const EMPTY_MANUAL_STATS = [0, 1, 2, 3, 4].map((i) => ({ id: `manual-${i}`, label: '', valueText: '' }))

/** 공유 화면을 0.5초마다 확인해서, 지금 보고 있는 에코의 서브 스탯에 잘 맞는 캐릭터를 추천합니다. 모든 처리는 브라우저 안에서 합니다. */
export default function LiveEchoCheckPage({ onApplyEcho, characterEchoes }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState(null)
  const [subStats, setSubStats] = useState(null)
  const [detectedSetId, setDetectedSetId] = useState(null)
  const [manualSetId, setManualSetId] = useState('') // 사용자가 직접 고른 세트. 자동 인식보다 우선합니다.
  const setId = manualSetId || detectedSetId
  // 인식 결과의 각 칸을 직접 고쳐 쓸 수 있습니다. 고친 칸은 다음 인식에도 그대로 유지됩니다.
  const [manualStats, setManualStats] = useState(EMPTY_MANUAL_STATS)
  const [targets, setTargets] = useState([]) // 원하는 옵션: [{ label, minValue }]
  const statSlots = manualStats.map((row, i) => {
    // 옵션만 고르고 수치를 아직 안 고른 칸은 이전 인식 값을 쓰지 않고 비워 둡니다.
    if (row.label) return row.valueText ? row : null
    return subStats?.[i] ?? null
  })
  const filledStats = statSlots.filter(Boolean)
  const shownStats = filledStats.length > 0 ? filledStats : null
  // 열려 있는 팝업: 세트 고르기 { type: 'set' } 또는 넣을 자리 고르기 { type: 'slot', character, echo }
  const [picker, setPicker] = useState(null)
  const [detectedMain, setDetectedMain] = useState(null)
  const [manualMain, setManualMain] = useState(null) // { cost, label, valueText }
  const shownMain = manualMain ?? detectedMain
  // 코스트는 직접 고른 값이 먼저이고, 없으면 인식한 메인 옵션의 수치로 찾습니다(강화 중이라 수치가 다르면 모름).
  const [manualCost, setManualCost] = useState('')
  const detectedCost = costOfMain(detectedMain)
  const currentCost = manualCost || manualMain?.cost || detectedCost
  const mainCosts = currentCost ? [currentCost] : ['4', '3', '1']
  const changeCost = (cost) => {
    setManualCost(cost)
    // 고른 옵션이 새 코스트에도 있으면 수치만 맞추고, 없으면 비웁니다.
    const valueText = MAIN_STAT_VALUES[cost]?.[shownMain?.label]
    setManualMain(valueText ? { cost, label: shownMain.label, valueText } : null)
  }
  const [savedNotice, setSavedNotice] = useState(null)
  const [debugViews, setDebugViews] = useState([]) // 마지막 확인에서 읽은 영역: [{ title, image, text }]
  const saveAndStay = ({ character, echo }, slot) => {
    onApplyEcho(character, echo, slot, true)
    setPicker(null)
    setSavedNotice(`${character.name} 에코 ${slot + 1}에 저장했어요.`)
  }
  const updateManualStat = (id, patch) =>
    setManualStats((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setSharing(false)
  }

  useEffect(() => stop, [])

  const start = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 5 }, audio: false })
      streamRef.current = stream
      stream.getVideoTracks()[0].addEventListener('ended', stop)
      setSubStats(null)
      setSharing(true)
    } catch (e) {
      if (e.name !== 'NotAllowedError') setError('화면 공유를 시작하지 못했어요.')
    }
  }

  useEffect(() => {
    if (!sharing) return undefined
    videoRef.current.srcObject = streamRef.current

    let busy = false
    let cancelled = false
    let lastSignature = null // 마지막으로 글자 인식을 돌린 화면
    let previousSignature = null // 바로 전 확인의 화면
    const session = createOcrSession()

    const check = async () => {
      const video = videoRef.current
      // 이전 인식이 0.5초 넘게 걸리면 끝날 때까지 이번 확인은 건너뜁니다.
      if (busy || !video?.videoWidth) return
      busy = true
      try {
        const frame = document.createElement('canvas')
        frame.width = video.videoWidth
        frame.height = video.videoHeight
        const frameCtx = frame.getContext('2d', { willReadFrequently: true })
        frameCtx.drawImage(video, 0, 0)
        const { x, y, w, h } = findGameArea(frameCtx, frame.width, frame.height)
        const area = document.createElement('canvas')
        area.width = w
        area.height = h
        area.getContext('2d').drawImage(frame, x, y, w, h, 0, 0, w, h)

        const signature = panelSignature(area, w, h)
        // 화면이 움직이는 동안(에코 전환, 강화 연출 등)은 기다렸다가, 멈춘 뒤에 한 번만 인식합니다.
        const moving = signatureChanged(previousSignature, signature)
        previousSignature = signature
        if (moving || !signatureChanged(lastSignature, signature)) return
        lastSignature = signature

        const blob = await new Promise((resolve) => area.toBlob(resolve, 'image/png'))
        const { dataUrl } = await normalizeImage(new File([blob], 'live.png', { type: 'image/png' }))
        const crop = await cropNormalizedImage(dataUrl, FIXED_REGIONS.subStat)
        // 전처리한 이미지(실제로 글자 인식이 보는 그림)와 읽은 글자를 화면에 보여 주려고 함께 모읍니다.
        const views = []
        const read = async (title, blob, preprocess = true) => {
          const image = preprocess ? await preprocessForOcr(blob) : blob
          const result = await session.recognize(image)
          views.push({ title, image: await blobToDataURL(image), text: result.text.trim() })
          return result
        }

        let found = readSubStats((await read('오른쪽 서브 옵션', crop)).lines)
        let foundSetId = null
        let foundMain = null
        if (found.length > 0) {
          const mainCrop = await cropNormalizedImage(dataUrl, FIXED_REGIONS.mainStat)
          foundMain = readMainStat((await read('오른쪽 메인 옵션', mainCrop)).text)
          foundSetId = findSetId(
            (await read('화음 이펙트', await cropNormalizedImage(dataUrl, LIVE_REGIONS.sonata), false)).lines,
          )
        } else {
          // 오른쪽에서 못 읽으면 강화 화면으로 보고 왼쪽 패널을 읽습니다. 강화 화면에는 세트 표시가 없습니다.
          const enhanceCrop = await cropFromLeft(area, h, LIVE_REGIONS.enhanceSubStat)
          found = readSubStats((await read('왼쪽 서브 옵션', enhanceCrop)).lines)
          if (found.length > 0) {
            const mainCrop = await cropFromLeft(area, h, LIVE_REGIONS.enhanceMainStat)
            foundMain = readMainStat((await read('왼쪽 메인 옵션', mainCrop)).text)
          }
        }
        if (!cancelled) setDebugViews(views)
        if (cancelled) return
        // 스탯이 안 읽히면 에코 화면이 아닌 것으로 보고 빈 상태로 돌립니다.
        setSubStats(found.length > 0 ? found : null)
        setDetectedSetId(foundSetId)
        setDetectedMain(found.length > 0 ? foundMain : null)
      } catch (err) {
        console.error(err)
      } finally {
        busy = false
      }
    }

    const timer = setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
      session.terminate()
    }
  }, [sharing])

  const results = shownStats ? recommend(shownStats, setId, shownMain?.label) : []
  const setName = getEchoSet(setId)?.name

  return (
    <section className="live-check">
      <header>
        <span className="uploader__eyebrow">실시간 에코 체크 - 베타</span>
        <h2>강화한 에코, 누가 써야할까요?</h2>
        <p className="uploader__hint">
          실시간으로 에코 정보를 받아 추천 캐릭터를 안내해드립니다.
        </p>
      </header>

      <div className="live-check__layout">
        {!screenCaptureSupported ? (
          <p className="uploader__hint">화면 공유를 지원하는 PC 브라우저에서만 사용 가능합니다.</p>
        ) : (
          <div className="live-check__screen">
            <div className="screen-capture__preview">
              <video ref={videoRef} autoPlay muted playsInline hidden={!sharing} />
              {sharing ? <span className="screen-capture__live">● 공유 중</span> : <div className="screen-capture__idle" />}
            </div>
            {sharing ? (
              <button type="button" className="btn btn--ghost" onClick={stop}>
                공유 중지
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={start}>
                화면 공유 시작
              </button>
            )}
            {error && <p className="screen-capture__error">{error}</p>}

            {debugViews.length > 0 && (
              <details className="live-check__debug">
                <summary>인식 확인</summary>
                {debugViews.map((view) => (
                  <div key={view.title} className="live-check__debug-item">
                    <span>{view.title}</span>
                    <img src={view.image} alt={view.title} />
                    <pre>{view.text || '(읽은 글자 없음)'}</pre>
                  </div>
                ))}
              </details>
            )}
          </div>
        )}

          <div className="live-check__result">
            {shownStats && (
              <div className="live-check__echo">
                <strong>{setName ?? '세트를 읽지 못했어요'}</strong>
                {getEchoSet(setId)?.icon && <img src={getEchoSet(setId).icon} alt="" />}
              </div>
            )}
            <div className="live-check__set-select">
              <span>에코 세트</span>
              <button type="button" className="btn btn--ghost" onClick={() => setPicker({ type: 'set' })}>
                {manualSetId ? getEchoSet(manualSetId)?.name : '자동 인식'}
              </button>
            </div>
            <div className="live-check__main-head">
              <h3>메인 옵션</h3>
              <select
                className="echo-panel__cost echo-panel__cost-select"
                aria-label="에코 코스트"
                value={manualCost || currentCost || ''}
                onChange={(e) => changeCost(e.target.value)}
              >
                <option value="">COST 선택</option>
                {['1', '3', '4'].map((cost) => (
                  <option key={cost} value={cost}>COST {cost}</option>
                ))}
              </select>
            </div>
            <select
              className="live-check__select"
              aria-label="메인 옵션"
              value={manualMain ? `${manualMain.cost}|${manualMain.label}` : ''}
              onChange={(e) => {
                const [cost, label] = e.target.value.split('|')
                setManualMain(label ? { cost, label, valueText: MAIN_STAT_VALUES[cost][label] } : null)
              }}
            >
              <option value="">{detectedMain ? `${detectedMain.label} ${detectedMain.valueText} (${detectedCost ? `${detectedCost}코스트 ` : ''}인식)` : '메인 옵션 선택'}</option>
              {mainCosts.map((cost) => (
                <optgroup key={cost} label={`COST ${cost}`}>
                  {Object.entries(MAIN_STAT_VALUES[cost]).map(([label, valueText]) => (
                    <option key={label} value={`${cost}|${label}`}>{label} {valueText}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <h3>서브 옵션{shownStats ? ` (${shownStats.length}/5)` : ''}</h3>
            {shownStats && <RollOdds stats={shownStats} />}
            <ul className="live-check__sub-rows">
              {manualStats.map((row, i) => {
                // 직접 고른 값이 없으면 인식 결과를 보여 줍니다.
                const recognized = subStats?.[i]
                const label = row.label || recognized?.label || ''
                const valueText = row.label ? row.valueText : recognized?.valueText ?? ''
                const value = parseFloat(valueText)
                const chance = valueText ? tierProbability(label, value) : null
                const wanted = targets.some((t) => t.label === label)
                return (
                  <li key={row.id} className={wanted ? 'live-check__sub--wanted' : ''}>
                    <select
                      className="live-check__select"
                      aria-label={`서브 옵션 ${i + 1}`}
                      value={label}
                      onChange={(e) => updateManualStat(row.id, { label: e.target.value, valueText: '' })}
                    >
                      <option value="">옵션 선택</option>
                      {SUB_STAT_NAMES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <select
                      className="live-check__select"
                      aria-label={`서브 옵션 ${i + 1} 수치`}
                      value={valueText}
                      disabled={!label}
                      onChange={(e) => updateManualStat(row.id, { label, valueText: e.target.value })}
                    >
                      <option value="">수치</option>
                      {(SUB_STAT_OPTIONS[label] ?? []).map((value) => (
                        <option key={value} value={formatSubStatValue(label, value)}>{formatSubStatValue(label, value)}</option>
                      ))}
                    </select>
                    {chance !== null && (
                      <small className="live-check__tier-odds">
                        이 수치 확률 {chance.toFixed(1)}% · 상위 {successProbability(label, value).toFixed(1)}%
                      </small>
                    )}
                  </li>
                )
              })}
            </ul>
            {manualStats.some((row) => row.label) && (
              <button type="button" className="btn btn--ghost" onClick={() => setManualStats(EMPTY_MANUAL_STATS)}>
                직접 고친 값 지우기
              </button>
            )}

            <TargetOdds targets={targets} setTargets={setTargets} stats={shownStats} />
          </div>

          <div className="live-check__result">
            <h3>추천 캐릭터</h3>
            {savedNotice && <p className="live-check__saved">{savedNotice}</p>}
            {results.length === 0 && <p className="uploader__hint">에코를 인식하거나 옵션을 고르면 추천해 드려요.</p>}
            <ol className="live-check__ranks">
              {results.map(({ character, rows, validCount, setMatched }) => (
                <li key={character.id}>
                  {character.image && <img src={character.image} alt="" />}
                  <div>
                    <span className="live-check__rank-head">
                      <strong>{character.name}</strong>
                      {setMatched && <em className="live-check__set-tag">추천 세트</em>}
                      <button
                        type="button"
                        className="btn btn--primary live-check__apply"
                        disabled={!shownMain || !currentCost || !MAIN_STAT_VALUES[currentCost]?.[shownMain.label]}
                        title="메인 옵션과 코스트를 골라야 적용할 수 있어요."
                        onClick={() => setPicker({ type: 'slot', character, echo: buildEcho(shownMain, shownStats, currentCost) })}
                      >
                        적용하기
                      </button>
                    </span>
                    <small>
                      유효 {validCount}/{shownStats.length}
                      {rows.length > 0 && <br />}
                      {rows.map((r) => r.label).join(' · ')}
                      {rows.length > 0 && (
                        <>
                          <br />
                          유효 옵션이 뜰 확률 {formatOdds(optionSetProbability(rows.map((r) => r.label)))}
                        </>
                      )}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </div>
      </div>

      <Modal open={picker?.type === 'slot'} title={`${picker?.character?.name} · 넣을 자리 선택`} onClose={() => setPicker(null)}>
        {picker?.type === 'slot' &&
          [0, 1, 2, 3, 4].map((slot) => {
            const existing = characterEchoes?.[picker.character.id] ?? []
            const current = existing[slot]
            // 그 자리에 넣었을 때 코스트 합계가 12를 넘으면 고를 수 없습니다.
            const usedCost = existing.reduce((sum, e, i) => sum + (i === slot ? 0 : Number(getEchoCost(e)) || 0), 0)
            const overCost = usedCost + (Number(picker.echo.cost) || 0) > MAX_TOTAL_COST
            return (
              <div key={slot} className="picker-item picker-item--simple live-check__slot">
                <span>
                  에코 {slot + 1}
                  {current && ` (${getEchoCost(current) ?? '?'}코스트)`}
                </span>
                {overCost ? (
                  <span className="picker-item__tag">코스트 초과</span>
                ) : (
                  <span className="live-check__slot-actions">
                    {current && (
                      <button type="button" className="btn btn--ghost" onClick={() => setPicker({ ...picker, type: 'compare', slot })}>
                        교체
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => (current ? setPicker({ ...picker, type: 'confirm', slot }) : saveAndStay(picker, slot))}
                    >
                      바로 저장
                    </button>
                  </span>
                )}
              </div>
            )
          })}
      </Modal>

      <ConfirmDialog
        open={picker?.type === 'confirm'}
        message="기존 에코가 사라집니다. 변경하시겠어요?"
        confirmLabel="확인"
        cancelLabel="취소"
        onConfirm={() => saveAndStay(picker, picker.slot)}
        onCancel={() => setPicker({ ...picker, type: 'slot' })}
      />

      <Modal open={picker?.type === 'compare'} title={`에코 ${(picker?.slot ?? 0) + 1} 교체`} onClose={() => setPicker({ ...picker, type: 'slot' })}>
        {picker?.type === 'compare' && (
          <>
            <div className="live-check__compare">
              <EchoCompareColumn
                title="기존 에코"
                echo={characterEchoes[picker.character.id][picker.slot]}
                characterId={picker.character.id}
              />
              <span className="live-check__compare-arrow" aria-hidden="true">↔</span>
              <EchoCompareColumn title="변경할 에코" echo={picker.echo} characterId={picker.character.id} />
            </div>
            <div className="live-check__compare-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setPicker({ ...picker, type: 'slot' })}>
                취소
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  onApplyEcho(picker.character, picker.echo, picker.slot)
                  setPicker(null)
                }}
              >
                확인
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal wide open={picker?.type === 'set'} title="에코 세트 선택" onClose={() => setPicker(null)}>
        <button className="picker-item picker-item--simple" onClick={() => { setManualSetId(''); setPicker(null) }}>
          <span>자동 인식</span>
        </button>
        {Object.entries(ECHO_SETS).map(([id, set]) => (
          <button key={id} className="picker-item picker-item--simple" onClick={() => { setManualSetId(id); setPicker(null) }}>
            {set.icon && <img src={set.icon} alt="" className="picker-item__icon" />}
            <span>{set.name}</span>
          </button>
        ))}
      </Modal>
    </section>
  )
}
