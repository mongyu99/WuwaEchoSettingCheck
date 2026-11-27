import './TunerGuide.css'

// 총 평균 시도 수가 어느 정도인지 감을 잡게 하는 기준표(지금 계획이 속한 줄을 강조합니다).
const GUIDE = [
  { min: 0, range: '~200개', text: '평범하게 도달 가능한 수치입니다.' },
  { min: 200, range: '200~1,000개', text: '재화가 많이 소모되지만, 애정을 담으면 가능합니다.' },
  { min: 1000, range: '1,000~10,000개', text: '정말 많은 시간과, 재화가 소모됩니다.' },
  { min: 10000, range: '10,000개~', text: '사실상 불가능한 수준입니다.' },
]

export default function TunerGuide({ attempts }) {
  return (
    <div className="tuner-guide">
      <p className="tuner-guide__title">총 평균 에코 개수</p>
      <p className="tuner-guide__sub">서브 옵션 5개가 다 열리는 +25까지 강화한 에코 기준이에요.</p>
      <ul>
        {GUIDE.map((g, i) => {
          const on = attempts >= g.min && attempts < (GUIDE[i + 1]?.min ?? Infinity)
          return (
            <li key={g.min} className={on ? 'tuner-guide--on' : ''}>
              {/* ▶ 자리는 늘 비워 둬서, 강조 줄이 바뀌어도 칸이 밀리지 않게 */}
              <span className="tuner-guide__mark" aria-hidden="true">{on ? '▶' : ''}</span>
              <span className="tuner-guide__range">{g.range}</span>
              <span>{g.text}</span>
            </li>
          )
        })}
      </ul>
      <p className="tuner-guide__worst">최악에는 평균이 없습니다.</p>
    </div>
  )
}
