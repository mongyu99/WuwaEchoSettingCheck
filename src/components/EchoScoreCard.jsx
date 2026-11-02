import { GRADES, POINTS_PER_OPTION, gradeOf, scoreValidStats, scoreEchoes } from '../utils/echoScore'
import { assetPath } from '../config/assetPath'
import './EchoScoreCard.css'

export default function EchoScoreCard({ echoes, selectedIndex, validLabels }) {
  const scores = echoes.map((echo) => scoreValidStats(echo.subStats, validLabels))
  const total = scoreEchoes(echoes, validLabels)
  const grade = gradeOf(total)
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
            유효 옵션 점수 = 그 수치 이하가 나올 누적 확률 × {POINTS_PER_OPTION}
            <br />
            플랫 옵션(공격력·방어력·HP)은 위 점수의 절반
            <br />
            에코 점수 = 유효 옵션 점수의 합 (최대 100)
            <br />
            합계 = 에코 5개 점수의 합 (최대 500)
          </p>
          <p className="echo-score__rule">
            에코의 서브 옵션 5칸이 모두 유효 옵션의 1티어면 100점입니다. 옵션 한 칸에 {POINTS_PER_OPTION}점을 주고, 잘
            나오지 않는 수치일수록 높은 점수를 줍니다. 얼마나 잘 뽑았는지를 나타내는 점수이며, 옵션 종류별 데미지
            기여도는 반영하지 않습니다.
          </p>
        </div>
      </div>
      <div className="echo-score__summary">
        <img className="echo-score__grade" src={assetPath(`grades/${grade.icon}.png`)} alt={grade.label} />
        <strong className="echo-score__total">{total.toFixed(1)}</strong>
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
