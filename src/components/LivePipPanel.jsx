import { createPortal } from 'react-dom'
import { getEchoSet } from '../config/echoSets'
import './BagPipPanel.css'
import './LivePipPanel.css'

const TOP_COUNT = 3

/**
 * 실시간 에코 체크 PiP 창 안의 내용: 세트·코스트 한 줄, 강화 목표 카드(missionCard, 페이지와 같은 것), 추천 캐릭터 상위 3명.
 */
export default function LivePipPanel({ pipWindow, sharing, setId, cost, stats, missionCard, results }) {
  if (!pipWindow) return null
  const set = getEchoSet(setId)

  return createPortal(
    <div className="bag-pip live-pip">
      <div className="bag-pip__status">
        <span className={`bag-pip__live ${sharing ? 'bag-pip__live--on' : ''}`}>{sharing ? '● 인식 중' : '공유 꺼짐'}</span>
      </div>

      {stats ? (
        <p className="live-pip__set live-pip__echo">
          {set?.icon && <img src={set.icon} alt="" />}
          <strong>{set?.name ?? '세트 모름'}</strong>
          <em>{cost ? `${cost}코` : '코스트 모름'}</em>
        </p>
      ) : (
        <p className="bag-pip__empty">게임에서 에코를 띄우면 여기에 나와요.</p>
      )}

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
    </div>,
    pipWindow.document.body,
  )
}
