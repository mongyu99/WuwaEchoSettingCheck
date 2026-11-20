import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { screenCaptureSupported } from '../components/ScreenCapture'
import { SUB_STAT_NAMES } from '../config/subStatOptions'
import { ECHO_SETS, getEchoSet } from '../config/echoSets'
import { MAIN_STAT_VALUES } from '../config/echoMainStats'
import Modal from '../components/Modal'
import BagPipPanel, { pipSupported, usePipWindow } from '../components/BagPipPanel'
import CharacterPicker from '../components/CharacterPicker'
import OcrHelpLink from '../components/OcrHelpLink'
import { useCountUp } from '../utils/useCountUp'
import { flyTo } from '../utils/flyTo'
import { useFlipList } from '../utils/useFlipList'
import { jelly } from '../utils/jelly'
import { assetPath } from '../config/assetPath'
import { gradeOf } from '../utils/echoScore'
import { createOcrPool } from '../utils/ocr'
import { findGameRect, grabRect, recognizeEchoPanel } from '../utils/echoRecognition'
import { MIN_CHANGED_CELLS, bagPanelSignature, bagSignatureDiff } from '../utils/screenWatch'
import { BAG_DEBUG_BOXES, drawDebugSnapshot } from '../utils/bagDebug'
import { evaluateBagItem, filterAndSort, rankForCharacter, toBagItem, withSet } from '../utils/echoBag'
import { CHARACTERS } from '../config/characters'
import { saveOcrSample } from '../utils/ocrSample'
import { clearBag, deleteBagItem, loadBag, saveBagItem } from '../utils/bagStore'
import '../components/ScreenCapture.css'
import './LiveEchoCheckPage.css'
import './EchoBagPage.css'

// 가방은 에코를 빠르게 넘기므로 실시간 체크(0.5초)보다 자주 봅니다. 화면 비교는 64x128 픽셀이라 가볍습니다.
// 빠르게 넘겨도 놓치지 않게 0.1초마다 봅니다. 매번 전체 화면을 복사하던 걸 빼고(게임 위치는 2초마다만 다시 찾음)
// 작은 비교용 그림만 영상에서 바로 뽑아서 가볍습니다. 전체 화면은 큐에 넣을 때만 잘라 냅니다.
const CHECK_INTERVAL_MS = 100
const RECT_REFRESH_MS = 2000
// 초당 30프레임·매 프레임 확인으로 올렸더니 오히려 27개 중 17개만 잡혀서(24개 → 17개) 15프레임·0.1초로 둡니다.
const CAPTURE_FPS = 15

/** 가방 에코 한 줄. 마우스를 올리면 상세가 살짝 보이고, 누르면 펼친 채로 고정됩니다. */
const PAGE_SIZE = 200 // 목록에 한 번에 그리는 에코 수("더 보기"로 늘립니다)

function BagRow({ item, index, open, incoming, exiting, onToggle, highlight, onRemove, onPickSet }) {
  const score = useCountUp(item.score)
  const set = getEchoSet(item.setId)
  const icon = item.thumbnail
  const grade = gradeOf(item.score * 5)
  return (
    <li
      data-key={item.key}
      data-flip-key={item.key}
      className={`echo-bag__row ${open ? 'echo-bag__row--open' : ''} ${incoming ? 'echo-bag__row--incoming' : ''} ${exiting ? 'echo-bag__row--exiting' : ''}`}
      style={{ '--i': Math.min(index, 12) }}
    >
      <button type="button" className="echo-bag__summary" onClick={onToggle} aria-expanded={open}>
        <span className="echo-bag__photo">
          {icon ? <img src={icon} alt="" /> : <span className="echo-bag__photo-empty" />}
          {set?.icon && <img className="echo-bag__photo-set" src={set.icon} alt={set.name} title={set.name} />}
        </span>
        <span className="echo-bag__main">
          {set ? (
            set.name
          ) : (
            // 세트를 못 읽었으면 눌러서 직접 고릅니다(행 펼치기와 따로 동작).
            <span
              role="button"
              tabIndex={0}
              className="echo-bag__set-pick"
              onClick={(e) => {
                e.stopPropagation()
                onPickSet()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onPickSet()
                }
              }}
            >
              세트 지정하기
            </span>
          )}
          <small>
            {item.main ? `${item.main.label} ${item.main.valueText}` : '주옵션 모름'} | {item.cost ? `${item.cost}코스트` : '코스트 모름'}
          </small>
        </span>
        <span className="echo-bag__valid">
          {/* 옵션 이름만 보여 줍니다. 수치는 펼친 상세에서 봅니다. */}
          {item.subStats.map((s) => (
            <span key={s.label} className="echo-bag__valid-chip">
              {s.label}
            </span>
          ))}
        </span>
        {/* 점수는 등급(티어) 아이콘으로 보여 줍니다. 등급표는 에코 5개 합계 기준이라 에코 하나 점수 × 5로 봅니다. */}
        <span className="echo-bag__tier" title={`${grade.label} · ${item.score.toFixed(1)}점`}>
          {item.costRank && <b className="echo-bag__cost-rank">{item.costRank}코 1위</b>}
          <img key={grade.icon} className="echo-bag__tier-icon" src={assetPath(`grades/${grade.icon}.png`)} alt={grade.label} />
          <small>{score.toFixed(1)}</small>
        </span>
      </button>
      <div className="echo-bag__detail">
        <div className="echo-bag__detail-inner">
          <dl>
            <div>
              <dt>세트</dt>
              <dd>
                {set?.name ?? '세트 모름'}{' '}
                <button type="button" className="echo-bag__set-change" onClick={onPickSet}>
                  {set ? '바꾸기' : '지정하기'}
                </button>
              </dd>
            </div>
            <div>
              <dt>추천 캐릭터</dt>
              <dd>
                {item.bestCharacter?.name ?? '-'} · 유효 {item.validCount}
              </dd>
            </div>
          </dl>
          <ul className="echo-bag__subs">
            {item.subStats.map((s) => (
              <li key={s.label} className={highlight(s.label) ? 'echo-bag__sub--hit' : ''}>
                <span>{s.label}</span>
                <strong>{s.valueText}</strong>
              </li>
            ))}
          </ul>
          <button type="button" className="echo-bag__remove" onClick={onRemove}>
            이 에코 지우기
          </button>
        </div>
      </div>
    </li>
  )
}
// 사용자가 글자 인식보다 빨리 넘기면 화면을 잠깐 줄 세웁니다. 넘치면 가장 오래된 화면부터 버립니다.
const MAX_QUEUE = 10

/** 에코 가방 정리: 화면 공유로 가방의 에코를 하나씩 읽어 모으고, 에코마다 맞는 캐릭터와 점수를 매깁니다. */
export default function EchoBagPage({ onGoToRecommend }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([]) // 평가까지 끝난 에코들
  const [loaded, setLoaded] = useState(false) // 저장된 기록을 다 불러왔는지(그 전엔 "없어요" 대신 불러오는 중으로 보여줍니다)
  const [stats, setStats] = useState({ duplicate: 0, pending: 0 })
  // 저장·중복 건너뜀 때마다 n을 올려서, 화면 공유 위 표시를 처음부터 다시 반짝이게 합니다(key로 다시 그림).
  const [flash, setFlash] = useState({ n: 0, kind: 'saved' })
  const pip = usePipWindow()
  const showFlash = (kind) => setFlash((f) => ({ n: f.n + 1, kind }))
  // 개발자 도구: 어디를 읽는지(박스)와 0.25초마다의 판단을 보여 줍니다.
  const [debug, setDebug] = useState(false)
  const debugRef = useRef(false)
  debugRef.current = debug
  const [debugLog, setDebugLog] = useState([]) // 최근 판단 기록(최신이 위)
  const [debugShot, setDebugShot] = useState(null) // 마지막으로 큐에 넣은 화면 + 박스
  const [debugDiff, setDebugDiff] = useState(null) // 매 확인의 { moving, sinceLast }
  const log = (kind, text) => {
    if (!debugRef.current) return
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false })
    setDebugLog((list) => [{ id: `${Date.now()}-${Math.random()}`, time, kind, text }, ...list].slice(0, 40))
  }

  // 저장해 둔 결과를 불러옵니다(새로고침해도 이어서).
  useEffect(() => {
    loadBag()
      .then((rows) => setItems(rows.map(evaluateBagItem)))
      .catch((e) => console.error('가방 정리 기록을 불러오지 못했어요.', e))
      .finally(() => setLoaded(true))
  }, [])

  const keysRef = useRef(new Set())
  useEffect(() => {
    keysRef.current = new Set(items.map((i) => i.key))
  }, [items])

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setSharing(false)
  }
  useEffect(() => stop, [])

  const start = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: CAPTURE_FPS }, audio: false })
      streamRef.current = stream
      stream.getVideoTracks()[0].addEventListener('ended', stop)
      setSharing(true)
    } catch (e) {
      if (e.name !== 'NotAllowedError') setError('화면 공유를 시작하지 못했어요.')
    }
  }

  useEffect(() => {
    if (!sharing) return undefined
    videoRef.current.srcObject = streamRef.current

    let cancelled = false
    let lastSignature = null // 마지막으로 큐에 넣은 화면
    let previousSignature = null // 바로 전 확인의 화면
    let rect = null // 공유 화면 안 게임 화면 위치
    let rectAt = 0
    const queue = []
    let working = false
    // 서브·메인 두 영역을 동시에 읽도록 작업자를 2개 둡니다.
    const session = createOcrPool(2)
    const updatePending = () => setStats((s) => ({ ...s, pending: queue.length }))

    // 큐에서 하나씩 꺼내 글자 인식 → 중복 확인 → 저장합니다.
    const drain = async () => {
      if (working) return
      working = true
      try {
        while (queue.length > 0 && !cancelled) {
          const area = queue.shift()
          updatePending()
          // 개발 서버에서는 OCR 원문까지 남겨 테스트 자료로 저장합니다.
          const recognized = await recognizeEchoPanel(area, session, {
            withViews: import.meta.env.DEV || debugRef.current,
            layout: 'bag',
          })
          saveOcrSample(area, recognized, 'bag')
          const item = toBagItem(recognized)
          if (cancelled) continue
          if (!item) {
            log('skip', `에코 화면 아님(서브 옵션을 못 읽음) · OCR: ${recognized.views?.[0]?.text?.replace(/\n/g, ' / ') || '(빈 글자)'}`)
            continue
          }
          if (keysRef.current.has(item.key)) {
            // 이름 인식 전에 저장된 에코면, 이번에 읽은 메인 에코 이름만 채워 둡니다(캐릭터 추천의 메인 에코 자리용).
            if (item.echoId) {
              setItems((list) =>
                list.map((old) => {
                  if (old.key !== item.key || old.echoId) return old
                  const { bestCharacter, score, validCount, validRows, ...stored } = { ...old, echoId: item.echoId }
                  saveBagItem(stored).catch((e) => console.error('가방 정리 기록 저장 실패', e))
                  return { ...old, echoId: item.echoId }
                }),
              )
            }
            log('dup', `중복이라 건너뜀: ${item.subStats.map((x) => x.label + ' ' + x.valueText).join(', ')}`)
            setStats((s) => ({ ...s, duplicate: s.duplicate + 1 }))
            showFlash('dup')
            continue
          }
          log('save', `저장: 세트 ${getEchoSet(item.setId)?.name ?? '모름'} · 옵션 ${item.subStats.length}개`)
          keysRef.current.add(item.key)
          showFlash('saved')
          setItems((list) => [...list, evaluateBagItem(item)])
          if (item.thumbnail) {
            setFlyingKey(item.key)
            setPendingFly({ key: item.key, src: item.thumbnail })
          }
          saveBagItem(item).catch((e) => console.error('가방 정리 기록 저장 실패', e))
        }
      } catch (err) {
        console.error(err)
      } finally {
        working = false
      }
    }

    // 0.25초마다 화면을 보고, 움직임이 멈춘 새 화면만 큐에 넣습니다.
    const check = () => {
      const video = videoRef.current
      if (!video?.videoWidth) return
      const now = performance.now()
      if (!rect || now - rectAt > RECT_REFRESH_MS) {
        rect = findGameRect(video)
        rectAt = now
      }
      const signature = bagPanelSignature(video, rect.w, rect.h, rect.x, rect.y)
      const movingCells = bagSignatureDiff(previousSignature, signature)
      const sinceLastCells = bagSignatureDiff(lastSignature, signature)
      const moving = movingCells >= MIN_CHANGED_CELLS
      previousSignature = signature
      if (debugRef.current) setDebugDiff({ moving: movingCells, sinceLast: sinceLastCells })
      if (moving) return // 화면이 바뀌는 중: 멈출 때까지 기다립니다.
      if (sinceLastCells < MIN_CHANGED_CELLS) return // 마지막으로 읽은 화면과 같음
      lastSignature = signature
      const area = grabRect(video, rect)
      log('queue', `새 화면 → 인식 대기열(마지막 화면과 ${Number.isFinite(sinceLastCells) ? sinceLastCells : '∞'}칸 다름)`)
      if (debugRef.current) setDebugShot(drawDebugSnapshot(area))
      queue.push(area)
      if (queue.length > MAX_QUEUE) queue.shift()
      updatePending()
      drain()
    }

    const timer = setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
      session.terminate()
    }
  }, [sharing])

  // 고른 서브 옵션을 모두 가진 에코만 보고, 점수 또는 특정 옵션 수치 순으로 정렬합니다.
  const [required, setRequired] = useState([]) // 부옵션(모두 가진 에코)
  const [mains, setMains] = useState([]) // 메인 옵션(하나라도)
  const [costs, setCosts] = useState([]) // 코스트(하나라도)
  const [sets, setSets] = useState([]) // 세트(하나라도)
  const [sortKey, setSortKey] = useState('recent')
  // 캐릭터 맞춤: 고르면 그 캐릭터에게 맞는 에코만, 그 캐릭터 점수 높은 순으로 보여 줍니다(정렬 선택은 무시).
  const [targetId, setTargetId] = useState('')
  const target = useMemo(() => CHARACTERS.find((c) => c.id === targetId) ?? null, [targetId])
  const [filterOpen, setFilterOpen] = useState(false)
  const toggleIn = (setter) => (value) => setter((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]))
  const filterCount = required.length + mains.length + costs.length + sets.length
  const clearFilters = () => {
    setRequired([])
    setMains([])
    setCosts([])
    setSets([])
  }
  const sorted = useMemo(
    () => {
      const base = filterAndSort(items, { required, mains, costs, sets, sortKey })
      return target ? rankForCharacter(base, target) : base
    },
    [items, required, mains, costs, sets, sortKey, target],
  )
  // 수천 개를 한 번에 그리면 느려서, 정렬·필터 결과 중 앞에서부터 PAGE_SIZE개씩만 그립니다.
  // 조건이 바뀌면 다시 처음 PAGE_SIZE개부터 보여줍니다.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  useEffect(() => setVisibleCount(PAGE_SIZE), [required, mains, costs, sets, sortKey, targetId])
  const shown = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount])

  // 세트 지정 팝업: 세트를 못 읽은(또는 잘못 읽은) 에코의 세트를 직접 고릅니다.
  const [setPickKey, setSetPickKey] = useState(null)
  const pickSet = (setId) => {
    const target = items.find((i) => i.key === setPickKey)
    setSetPickKey(null)
    if (!target) return
    const updated = withSet(target, setId)
    setItems((list) => list.map((i) => (i.key === target.key ? updated : i)))
    const { bestCharacter, score, validCount, validRows, ...stored } = updated
    saveBagItem(stored).catch((e) => console.error('세트 저장 실패', e))
  }
  // 정렬·필터가 바뀌면 행이 새 자리로 미끄러져 가고, 빠지는 행은 흐려지며 사라집니다.
  const { rendered, listRef } = useFlipList(shown, (item) => item.key)

  const [openKey, setOpenKey] = useState(null) // 눌러서 펼쳐 둔 에코

  // 저장되면 공유 화면(상세 패널 자리)에서 사진이 튀어나와 목록의 그 행으로 날아갑니다.
  const previewRef = useRef(null)
  const [flyingKey, setFlyingKey] = useState(null)
  const [pendingFly, setPendingFly] = useState(null) // { key, src }
  useEffect(() => {
    if (!pendingFly) return
    const { key, src } = pendingFly
    const preview = previewRef.current?.getBoundingClientRect()
    const row = listRef.current?.querySelector(`[data-key="${CSS.escape(key)}"]`)
    // 목록은 한 박자 늦게 그려지므로(정렬 애니메이션), 행이 생길 때까지 기다립니다.
    // 필터에 걸리거나 "더 보기" 뒤쪽이라 목록에 안 나오는 에코면 기다리지 않고 날리지 않습니다.
    if (!row && shown.some((i) => i.key === key)) return
    setPendingFly(null)
    if (!preview || !row) {
      setFlyingKey(null)
      return
    }
    // 게임 화면의 상세 패널은 공유 화면 오른쪽 위쪽에 있습니다.
    const from = { left: preview.left + preview.width * 0.72, top: preview.top + preview.height * 0.08, width: preview.width * 0.26, height: preview.height * 0.4 }
    const rowRect = row.getBoundingClientRect()
    const visible = rowRect.bottom > 0 && rowRect.top < window.innerHeight
    // 행이 화면 밖(점수 순으로 아래쪽)이면, 목록에서 지금 화면에 보이는 위쪽 자리(사진 크기)로 날립니다.
    const list = listRef.current.getBoundingClientRect()
    const target = visible
      ? row.querySelector('.echo-bag__photo') ?? row
      : { left: list.left + 18, top: Math.min(Math.max(list.top + 30, 12), window.innerHeight - 80), width: 56, height: 56 }
    flyTo(src, from, target, {
      onLand: () => {
        setFlyingKey(null)
        jelly(visible ? row : listRef.current)
      },
    })
  }, [pendingFly, rendered]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeItem = (key) => {
    setItems((list) => list.filter((i) => i.key !== key))
    deleteBagItem(key).catch(console.error)
  }

  const resetAll = () => {
    if (!window.confirm(`인식한 에코 ${items.length}개를 모두 지울까요?`)) return
    setItems([])
    setStats({ duplicate: 0, pending: 0 })
    clearBag().catch(console.error)
  }

  return (
    <section className="live-check echo-bag">
      <header className="page-head--help">
        <OcrHelpLink />
        <span className="uploader__eyebrow">에코 가방</span>
        <h2>가방의 에코, 한 번에 정리해요</h2>
        <p className="uploader__hint">
          화면을 공유한 뒤 게임 가방에서 에코를 하나씩 눌러 주세요. 화면이 멈출 때마다 에코를 읽어 모읍니다.
        </p>
        <p className="uploader__hint">
          너무 빨리 넘기면 놓칠 수 있어요. 에코마다 0.3초 정도 머물러 주시고, "✓ 저장됨" 표시를 보고 넘기면 확실해요.
        </p>
      </header>

      <div className="echo-bag__layout">
        {!screenCaptureSupported ? (
          <p className="uploader__hint">화면 공유를 지원하는 PC 브라우저에서만 사용 가능합니다.</p>
        ) : (
          <div className="live-check__screen">
            <div className="screen-capture__preview" ref={previewRef}>
              <video ref={videoRef} autoPlay muted playsInline hidden={!sharing} />
              {sharing ? <span className="screen-capture__live">● 공유 중</span> : <div className="screen-capture__idle" />}
              {sharing && flash.n > 0 && (
                <span
                  key={flash.n}
                  className={`echo-bag__saved-flash ${flash.kind === 'dup' ? 'echo-bag__saved-flash--dup' : ''}`}
                  aria-live="polite"
                >
                  {flash.kind === 'dup' ? '이미 있는 에코 · 건너뜀' : '✓ 저장됨'}
                </span>
              )}
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
            {/* 게임 위에 작은 창으로 저장 상태를 띄웁니다(크롬·엣지). 아래 기존 표시는 그대로 둡니다. */}
            {pipSupported && (
              <button type="button" className="btn btn--ghost" onClick={pip.pipWindow ? pip.close : pip.open}>
                {pip.pipWindow ? '작은 창 닫기' : '게임 위에 작은 창 띄우기'}
              </button>
            )}
            <BagPipPanel pipWindow={pip.pipWindow} flash={flash} items={items} stats={stats} sharing={sharing} />
            {error && <p className="screen-capture__error">{error}</p>}
            <dl className="echo-bag__counts">
              <div>
                <dt>인식한 에코</dt>
                <dd>{items.length.toLocaleString()}개</dd>
              </div>
              <div>
                <dt>중복 건너뜀</dt>
                <dd>{stats.duplicate.toLocaleString()}개</dd>
              </div>
              <div>
                <dt>인식 대기</dt>
                <dd>{stats.pending}개</dd>
              </div>
            </dl>
            {items.length > 0 && (
              <button type="button" className="btn btn--ghost" onClick={resetAll}>
                전체 지우기
              </button>
            )}
            {/* 개발자 도구는 로컬 개발 서버에서만 보여 줍니다(운영 빌드에서는 버튼이 없습니다). */}
            {import.meta.env.DEV && (
              <button type="button" className="btn btn--ghost echo-bag__debug-toggle" onClick={() => setDebug((d) => !d)}>
                {debug ? '개발자 도구 닫기' : '개발자 도구'}
              </button>
            )}
            {import.meta.env.DEV && debug && (
              <div className="echo-bag__debug">
                <p className="echo-bag__debug-diff">
                  {debugDiff
                    ? `직전 화면과 ${Number.isFinite(debugDiff.moving) ? debugDiff.moving : '∞'}칸 · 마지막 인식과 ${
                        Number.isFinite(debugDiff.sinceLast) ? debugDiff.sinceLast : '∞'
                      }칸 (기준 ${MIN_CHANGED_CELLS}칸)`
                    : '화면 공유를 시작하면 0.25초마다 판단을 보여 줘요.'}
                </p>
                {debugShot && <img className="echo-bag__debug-shot" src={debugShot} alt="마지막으로 인식한 화면과 읽는 위치" />}
                <ul className="echo-bag__debug-legend">
                  {BAG_DEBUG_BOXES.map((b) => (
                    <li key={b.label}>
                      <i style={{ background: b.color }} />
                      {b.label}
                    </li>
                  ))}
                </ul>
                <ol className="echo-bag__debug-log">
                  {debugLog.map((l) => (
                    <li key={l.id} className={`echo-bag__debug-${l.kind}`}>
                      <time>{l.time}</time> {l.text}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="live-check__result echo-bag__result">
          <div className="echo-bag__toolbar">
            <h3>
              {target
                ? `${target.name}에게 맞는 에코 ${sorted.length.toLocaleString()}개`
                : filterCount > 0
                  ? `조건에 맞는 에코 ${sorted.length.toLocaleString()}개`
                  : '인식한 에코'}
            </h3>
            <CharacterPicker value={target} onChange={(c) => setTargetId(c?.id ?? '')} placeholder="캐릭터 맞춤: 전체" clearLabel="전체 보기" />
            <button type="button" className={`echo-bag__filter-btn ${filterCount ? 'echo-bag__filter-btn--on' : ''}`} onClick={() => setFilterOpen(true)}>
              필터{filterCount > 0 && <b>{filterCount}</b>}
            </button>
            <select className="live-check__select echo-bag__sort" aria-label="정렬" value={sortKey} onChange={(e) => setSortKey(e.target.value)} disabled={!!target} title={target ? '캐릭터 맞춤 중에는 그 캐릭터 점수 순으로 정렬돼요' : undefined}>
              <option value="recent">최근 등록 순</option>
              <option value="score">점수 높은 순</option>
              {SUB_STAT_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name} 높은 순
                </option>
              ))}
            </select>
            {/* 모은 에코로 캐릭터마다 5개 조합을 짜 주는 캐릭터 추천으로 이동(캐릭터 맞춤 중이면 그 캐릭터로 바로) */}
            {onGoToRecommend && (
              <button type="button" className="btn btn--ghost echo-bag__to-recommend" onClick={() => onGoToRecommend(target?.id ?? null)}>
                추천 세팅 →
              </button>
            )}
          </div>
          {!loaded ? (
            <p className="uploader__hint">불러오는 중...</p>
          ) : sorted.length === 0 ? (
            <p className="uploader__hint">
              {items.length === 0 ? '아직 인식한 에코가 없어요.' : target ? `${target.name}에게 맞는 세트·메인 옵션의 에코가 없어요.` : '필터 조건에 맞는 에코가 없어요.'}
            </p>
          ) : (
            <ul className="echo-bag__list" ref={listRef}>
              <li className="echo-bag__head" aria-hidden="true">
                <span>사진 · 세트</span>
                <span>세트 · 주옵션</span>
                <span>옵션</span>
                <span>등급</span>
              </li>
              {rendered.map(({ item, exiting }, i) => (
                <BagRow
                  key={item.key}
                  item={item}
                  index={i}
                  exiting={exiting}
                  open={openKey === item.key}
                  incoming={flyingKey === item.key}
                  onToggle={() => setOpenKey((k) => (k === item.key ? null : item.key))}
                  highlight={(label) => required.includes(label) || sortKey === label}
                  onRemove={() => removeItem(item.key)}
                  onPickSet={() => setSetPickKey(item.key)}
                />
              ))}
            </ul>
          )}
          {sorted.length > shown.length && (
            <button
              type="button"
              className="btn btn--ghost echo-bag__more"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              {Math.min(PAGE_SIZE, sorted.length - shown.length)}개 더 보기 ({shown.length.toLocaleString()} / {sorted.length.toLocaleString()})
            </button>
          )}
        </div>
      </div>

      {/* 필터 서랍: 오른쪽에서 슉 나옵니다.
          페이지 등장 애니메이션(transform) 중에는 fixed가 화면이 아니라 페이지 기준이 되어 서랍이 잠깐 보여서 body에 그립니다. */}
      {createPortal(
      <div className={`echo-bag__drawer ${filterOpen ? 'echo-bag__drawer--open' : ''}`} aria-hidden={!filterOpen}>
        <div className="echo-bag__drawer-backdrop" onClick={() => setFilterOpen(false)} />
        <aside className="echo-bag__drawer-panel" role="dialog" aria-label="에코 필터">
          <header className="echo-bag__drawer-head">
            <h3>필터</h3>
            <button type="button" className="echo-bag__drawer-reset" onClick={clearFilters} disabled={filterCount === 0}>
              초기화
            </button>
            <button type="button" className="modal__close" onClick={() => setFilterOpen(false)} aria-label="닫기">
              ×
            </button>
          </header>
          <div className="echo-bag__drawer-body">
            <FilterGroup title="부옵션" hint="고른 옵션을 모두 가진 에코" options={SUB_STAT_NAMES} selected={required} onToggle={toggleIn(setRequired)} />
            <FilterGroup title="메인 옵션" hint="하나라도 해당" options={MAIN_LABELS} selected={mains} onToggle={toggleIn(setMains)} />
            <FilterGroup title="코스트" options={[4, 3, 1]} format={(c) => `${c}코스트`} selected={costs} onToggle={toggleIn(setCosts)} />
            <FilterGroup
              title="세트"
              options={Object.keys(ECHO_SETS)}
              format={(id) => (
                <>
                  {ECHO_SETS[id].icon && <img src={ECHO_SETS[id].icon} alt="" />}
                  {ECHO_SETS[id].name}
                </>
              )}
              selected={sets}
              onToggle={toggleIn(setSets)}
            />
          </div>
          <footer className="echo-bag__drawer-foot">
            <button type="button" className="btn btn--primary" onClick={() => setFilterOpen(false)}>
              {sorted.length.toLocaleString()}개 보기
            </button>
          </footer>
        </aside>
      </div>,
      document.body,
      )}

      {/* 세트 지정 팝업 */}
      <Modal wide open={!!setPickKey} title="세트 지정" onClose={() => setSetPickKey(null)}>
        {Object.entries(ECHO_SETS).map(([id, set]) => (
          <button key={id} type="button" className="picker-item picker-item--simple" onClick={() => pickSet(id)}>
            {set.icon && <img src={set.icon} alt="" className="picker-item__icon" />}
            <span>{set.name}</span>
          </button>
        ))}
      </Modal>
    </section>
  )
}

// 메인 옵션 이름 목록(코스트 상관없이 한 번씩).
const MAIN_LABELS = [...new Set(Object.values(MAIN_STAT_VALUES).flatMap((byLabel) => Object.keys(byLabel)))]

/** 필터 서랍의 한 묶음(제목 + 칩들). 캐릭터 추천 페이지의 필터 서랍에서도 씁니다. */
export function FilterGroup({ title, hint, options, selected, onToggle, format = (v) => v }) {
  return (
    <section className="echo-bag__filter-group">
      <h4>
        {title}
        {hint && <small>{hint}</small>}
      </h4>
      <div className="echo-bag__filter-chips">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`live-check__chip ${selected.includes(o) ? 'live-check__chip--on' : ''}`}
            onClick={() => onToggle(o)}
            aria-pressed={selected.includes(o)}
          >
            {format(o)}
          </button>
        ))}
      </div>
    </section>
  )
}
