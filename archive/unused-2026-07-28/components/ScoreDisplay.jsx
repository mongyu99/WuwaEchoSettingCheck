import { scoreTier } from '../utils/scoreCalculator'
import './ScoreDisplay.css'

const RADIUS = 88
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ScoreDisplay({ result }) {
  if (!result) return null
  const { score, breakdown } = result
  const tier = scoreTier(score)
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE

  return (
    <section className="score-sheet">
      <header className="score-sheet__head">
        <span className="uploader__eyebrow">03 — 공명 판정</span>
        <h2>이 메아리의 세팅 점수</h2>
      </header>

      <div className="score-sheet__body">
        <div className="ring">
          <svg viewBox="0 0 200 200" width="200" height="200">
            <circle cx="100" cy="100" r={RADIUS} className="ring__track" />
            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              className="ring__value"
              style={{
                stroke: tier.color,
                strokeDasharray: CIRCUMFERENCE,
                strokeDashoffset: offset,
              }}
            />
          </svg>
          <div className="ring__center">
            <span className="ring__tier" style={{ color: tier.color }}>
              {tier.label}
            </span>
            <span className="ring__score">{score}</span>
          </div>
        </div>

        <ul className="breakdown">
          {breakdown.map((b, i) => (
            <li key={i} className={`breakdown__row ${b.recognized ? '' : 'breakdown__row--unknown'}`}>
              <span className="breakdown__label">{b.label || '(미지정 스탯)'}</span>
              <span className="breakdown__value">{b.value}</span>
              {!b.recognized && <span className="breakdown__flag">가중치 미설정</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
