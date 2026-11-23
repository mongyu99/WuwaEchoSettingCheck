import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { jelly } from '../utils/jelly'
import { getEchoSet } from '../config/echoSets'
import { SUB_STAT_OPTIONS } from '../config/subStatOptions'
import './BagPipPanel.css'
import './LivePipPanel.css'

const TOP_COUNT = 3

/**
 * 실시간 에코 체크 PiP 창 안의 내용: 세트·코스트 한 줄, 강화 목표 카드(missionCard, 페이지와 같은 것), 추천 캐릭터 상위 3명.
 */
export default function LivePipPanel({ pipWindow, sharing, setId, cost, main, stats, missionCard, results, onRecognize, recognizing, flash, autoRecognize, onToggleAuto }) {
  // 새 에코를 읽을 때마다 페이지처럼 상자들을 젤리처럼 흔들어 "읽었다"는 걸 보여 줍니다(위에서부터 차례로).
  const echoRef = useRef(null)
  const bodyRef = useRef(null)
  const statsKey = JSON.stringify(stats ?? null)
  useEffect(() => {
    if (!stats) return undefined
    jelly(echoRef.current)
    const timer = setTimeout(() => jelly(bodyRef.current), 70)
    return () => clearTimeout(timer)
  }, [statsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!pipWindow) return null
  const set = getEchoSet(setId)

  return createPortal(
    <div className="bag-pip live-pip">
      <div className="bag-pip__status">
        <span className={`bag-pip__live ${sharing ? 'bag-pip__live--on' : ''}`}>{sharing ? '● 공유 중' : '공유 꺼짐'}</span>
        {flash.n > 0 && (
          <span key={flash.n} className={`bag-pip__flash ${flash.ok ? '' : 'bag-pip__flash--dup'}`}>
            {flash.ok ? '✓ 인식됨' : '못 읽었어요'}
          </span>
        )}
      </div>

      {sharing && (
        <div className="live-pip__controls">
          <button type="button" className="btn btn--primary live-pip__now" disabled={recognizing} onClick={onRecognize}>
            {recognizing ? '읽는 중...' : '📸 지금 인식'}
          </button>
          <button
            type="button"
            className={`motion-switch ${autoRecognize ? 'motion-switch--on' : ''}`}
            role="switch"
            aria-checked={autoRecognize}
            onClick={() => onToggleAuto(!autoRecognize)}
          >
            <span className="motion-switch__track">
              <span className="motion-switch__knob" />
            </span>
            자동
          </button>
        </div>
      )}

      {stats ? (
        <p className="live-pip__set live-pip__echo" ref={echoRef}>
          {set?.icon && <img src={set.icon} alt="" />}
          <strong>{set?.name ?? '세트 모름'}</strong>
          <em>{cost ? `${cost}코` : '코스트 모름'}</em>
        </p>
      ) : (
        <p className="bag-pip__empty">게임에서 에코를 띄우면 여기에 나와요.</p>
      )}

      <div className="live-pip__body" ref={bodyRef}>
      {missionCard}

      {stats && !missionCard && (
        <>
          <h4 className="live-pip__title">추천 캐릭터</h4>
          <ol className="bag-pip__list">
            {results.length === 0 && <li className="bag-pip__empty">어울리는 캐릭터가 없어요.</li>}
            {results.slice(0, TOP_COUNT).map(({ character, rows, validCount, setMatched }) => (
              <li key={character.id} className="bag-pip__item">
                {character.image ? <img className="bag-pip__thumb" src={character.image} alt="" /> : <span className="bag-pip__thumb" />}
                <div className="bag-pip__info">
                  <strong>
                    {character.name}
                    {setMatched && <em className="live-pip__tag">추천 세트</em>}
                  </strong>
                  <span>
                    유효 {validCount}/{stats.length}
                    {rows.length > 0 && ` · ${rows.map((r) => r.label).join(' · ')}`}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      </div>

      {/* 맨 아래: 지금 읽은 메인·서브 옵션(잘못 읽었는지 게임 화면과 바로 대 볼 수 있게) */}
      {stats && (
        <div className="live-pip__read">
          <h4 className="live-pip__title">읽은 옵션</h4>
          {main && (
            <p className="live-pip__main">
              {main.label} {main.valueText}
            </p>
          )}
          <ul className="live-pip__subs">
            {stats.map((st, i) => {
              const tiers = SUB_STAT_OPTIONS[st.label] ?? []
              const tier = tiers.indexOf(parseFloat(st.valueText)) + 1
              return (
                <li key={i}>
                  <span>{st.label}</span>
                  {tier > 0 && <small>{tier}/{tiers.length}</small>}
                  <b>{st.valueText}</b>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>,
    pipWindow.document.body,
  )
}
