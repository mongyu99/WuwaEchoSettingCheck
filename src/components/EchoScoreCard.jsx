import { GRADES, POINTS_PER_OPTION, gradeOf, scoreValidStats, scoreEchoes } from '../utils/echoScore'
import { assetPath } from '../config/assetPath'
import { useCountUp } from '../utils/useCountUp'
import './EchoScoreCard.css'

export default function EchoScoreCard({ echoes, selectedIndex, validLabels }) {
  const scores = echoes.map((echo) => scoreValidStats(echo.subStats, validLabels))
  const total = scoreEchoes(echoes, validLabels)
  const grade = gradeOf(total)
  const shownTotal = useCountUp(total)
  const rows = scores[selectedIndex]?.rows ?? []

  return (
    <section className="echo-score">
      {/* i 아이콘과 말풍선 스타일은 목표 스탯 계산기와 같은 것을 씁니다. */}
      <div className="optimizer__title-row echo-score__title-row">
        <span className="echo-score__title">유효 점수 합계</span>
        <span className="optimizer__info" tabIndex={0} role="button" aria-label="등급 기준 보기">
          i
        </span>
        <div className="optimizer__formula" role="tooltip">
          <ul className="echo-score__legend">
            {GRADES.map((g) => (
              <li key={g.icon}>
                <img src={assetPath(`grades/${g.icon}.png`)} alt={g.label} />
                <strong>{g.min}</strong>
              </li>
            ))}
          </ul>
          <p className="echo-score__rule">
            잘 나오지 않는 수치일수록 점수가 높습니다.
            <br />
            <br />
            옵션 점수 = 그 수치 이하가 나올 확률 × {POINTS_PER_OPTION}
            <br />
            플랫 옵션(공격력·방어력·HP)은 절반
            <br />
            합계 = 에코 5개의 옵션 점수 합
            <br />
            <br />
            확률에 기반한 점수이며, 유효 데미지 옵션을 기반한 점수가 아닙니다.
          </p>
        </div>
      </div>
      <div className="echo-score__summary">
        {/* key: 등급이 바뀔 때마다 아이콘을 새로 그려 "툭" 튀어나오는 애니메이션을 다시 재생합니다. */}
        <img key={grade.icon} className="echo-score__grade echo-score__grade--pop" src={assetPath(`grades/${grade.icon}.png`)} alt={grade.label} />
        <strong className="echo-score__total">{shownTotal.toFixed(1)}</strong>
      </div>

      <ol className="echo-score__echoes">
        {scores.map((score, i) => (
          <li key={echoes[i].id} className={i === selectedIndex ? 'echo-score__echo--active' : ''}>
            <span>에코 {i + 1}</span>
            <strong>{score.total.toFixed(1)}</strong>
          </li>
        ))}
      </ol>

      <span className="echo-score__title">에코 {selectedIndex + 1} 상세</span>
      {rows.length === 0 ? (
        <p className="echo-score__empty">유효 옵션 없음</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              <span className="echo-score__label">{row.label}</span>
              <span>{row.valueText}</span>
              <span className="echo-score__tier">{/* 표기는 최고 수치가 1티어입니다. */}{row.tier > 0 ? `${row.tierCount - row.tier + 1}티어` : '-'}</span>
              <strong>{row.points.toFixed(1)}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
