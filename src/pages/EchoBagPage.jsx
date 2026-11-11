import { useEffect, useMemo, useRef, useState } from 'react'
import { screenCaptureSupported } from '../components/ScreenCapture'
import { SUB_STAT_NAMES } from '../config/subStatOptions'
import { getEchoSet } from '../config/echoSets'
import { useCountUp } from '../utils/useCountUp'
import { flyTo } from '../utils/flyTo'
import { jelly } from '../utils/jelly'
import { assetPath } from '../config/assetPath'
import { gradeOf } from '../utils/echoScore'
import { createOcrPool } from '../utils/ocr'
import { grabGameArea, recognizeEchoPanel } from '../utils/echoRecognition'
import { MIN_CHANGED_CELLS, bagPanelSignature, bagSignatureDiff } from '../utils/screenWatch'
import { BAG_DEBUG_BOXES, drawDebugSnapshot } from '../utils/bagDebug'
import { evaluateBagItem, filterAndSort, toBagItem } from '../utils/echoBag'
import { saveOcrSample } from '../utils/ocrSample'
import { clearBag, deleteBagItem, loadBag, saveBagItem } from '../utils/bagStore'
import '../components/ScreenCapture.css'
import './LiveEchoCheckPage.css'
import './EchoBagPage.css'

// 가방은 에코를 빠르게 넘기므로 실시간 체크(0.5초)보다 자주 봅니다. 화면 비교는 64x128 픽셀이라 가볍습니다.
const CHECK_INTERVAL_MS = 250

/** 가방 에코 한 줄. 마우스를 올리면 상세가 살짝 보이고, 누르면 펼친 채로 고정됩니다. */
function BagRow({ item, index, open, incoming, onToggle, highlight, onRemove }) {
  const score = useCountUp(item.score)
  const set = getEchoSet(item.setId)
  const icon = item.thumbnail
  const grade = gradeOf(item.score * 5)
  return (
    <li
      data-key={item.key}
      className={`echo-bag__row ${open ? 'echo-bag__row--open' : ''} ${incoming ? 'echo-bag__row--incoming' : ''}`}
      style={{ '--i': Math.min(index, 12) }}
    >
      <button type="button" className="echo-bag__summary" onClick={onToggle} aria-expanded={open}>
        <span className="echo-bag__photo">
          {icon ? <img src={icon} alt="" /> : <span className="echo-bag__photo-empty" />}
          {set?.icon && <img className="echo-bag__photo-set" src={set.icon} alt={set.name} title={set.name} />}
        </span>
        <span className="echo-bag__main">
          {set?.name ?? '세트 모름'}
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
          <img key={grade.icon} className="echo-bag__tier-icon" src={assetPath(`grades/${grade.icon}.png`)} alt={grade.label} />
          <small>{score.toFixed(1)}</small>
        </span>
      </button>
      <div className="echo-bag__detail">
        <div className="echo-bag__detail-inner">
          <dl>
            <div>
              <dt>세트</dt>
              <dd>{set?.name ?? '세트 모름'}</dd>
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
export default function EchoBagPage() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([]) // 평가까지 끝난 에코들
  const [stats, setStats] = useState({ duplicate: 0, pending: 0 })
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
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 5 }, audio: false })
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
            log('dup', `중복이라 건너뜀: ${item.subStats.map((x) => x.label + ' ' + x.valueText).join(', ')}`)
            setStats((s) => ({ ...s, duplicate: s.duplicate + 1 }))
            continue
          }
          log('save', `저장: 세트 ${getEchoSet(item.setId)?.name ?? '모름'} · 옵션 ${item.subStats.length}개`)
          keysRef.current.add(item.key)
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
      const area = grabGameArea(video)
      const signature = bagPanelSignature(area, area.width, area.height)
      const movingCells = bagSignatureDiff(previousSignature, signature)
      const sinceLastCells = bagSignatureDiff(lastSignature, signature)
      const moving = movingCells >= MIN_CHANGED_CELLS
      previousSignature = signature
      if (debugRef.current) setDebugDiff({ moving: movingCells, sinceLast: sinceLastCells })
      if (moving) return // 화면이 바뀌는 중: 멈출 때까지 기다립니다.
      if (sinceLastCells < MIN_CHANGED_CELLS) return // 마지막으로 읽은 화면과 같음
      lastSignature = signature
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
  const [required, setRequired] = useState([])
  const [sortKey, setSortKey] = useState('recent')
  const toggleRequired = (label) =>
    setRequired((list) => (list.includes(label) ? list.filter((l) => l !== label) : [...list, label]))
  const sorted = useMemo(() => filterAndSort(items, { required, sortKey }), [items, required, sortKey])

  const [openKey, setOpenKey] = useState(null) // 눌러서 펼쳐 둔 에코

  // 저장되면 공유 화면(상세 패널 자리)에서 사진이 튀어나와 목록의 그 행으로 날아갑니다.
  const previewRef = useRef(null)
  const listRef = useRef(null)
  const [flyingKey, setFlyingKey] = useState(null)
  const [pendingFly, setPendingFly] = useState(null) // { key, src }
  useEffect(() => {
    if (!pendingFly) return
    const { key, src } = pendingFly
    setPendingFly(null)
    const preview = previewRef.current?.getBoundingClientRect()
    const row = listRef.current?.querySelector(`[data-key="${CSS.escape(key)}"]`)
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
  }, [pendingFly])

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
      <header>
        <span className="uploader__eyebrow">에코 가방 정리 - 베타</span>
        <h2>가방의 에코, 한 번에 정리해요</h2>
        <p className="uploader__hint">
          화면을 공유한 뒤 게임 가방에서 에코를 하나씩 눌러 주세요. 화면이 멈출 때마다 에코를 읽어 모읍니다.
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
            <button type="button" className="btn btn--ghost echo-bag__debug-toggle" onClick={() => setDebug((d) => !d)}>
              {debug ? '개발자 도구 닫기' : '개발자 도구'}
            </button>
            {debug && (
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
              {required.length > 0 ? `조건에 맞는 에코 ${sorted.length.toLocaleString()}개` : '인식한 에코'}
            </h3>
            <select className="live-check__select echo-bag__sort" aria-label="정렬" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="recent">최근 등록 순</option>
              <option value="score">점수 높은 순</option>
              {SUB_STAT_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name} 높은 순
                </option>
              ))}
            </select>
          </div>
          <div className="live-check__target-chips">
            {SUB_STAT_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className={`live-check__chip ${required.includes(name) ? 'live-check__chip--on' : ''}`}
                onClick={() => toggleRequired(name)}
              >
                {name}
              </button>
            ))}
          </div>
          {sorted.length === 0 ? (
            <p className="uploader__hint">{items.length === 0 ? '아직 인식한 에코가 없어요.' : '고른 옵션을 모두 가진 에코가 없어요.'}</p>
          ) : (
            <ul className="echo-bag__list" ref={listRef}>
              <li className="echo-bag__head" aria-hidden="true">
                <span>사진 · 세트</span>
                <span>세트 · 주옵션</span>
                <span>옵션</span>
                <span>등급</span>
              </li>
              {sorted.map((item, i) => (
                <BagRow
                  key={item.key}
                  item={item}
                  index={i}
                  open={openKey === item.key}
                  incoming={flyingKey === item.key}
                  onToggle={() => setOpenKey((k) => (k === item.key ? null : item.key))}
                  highlight={(label) => required.includes(label) || sortKey === label}
                  onRemove={() => removeItem(item.key)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
