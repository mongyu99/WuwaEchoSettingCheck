import './TunerGuide.css'

// 총 평균 시도 수가 어느 정도인지 감을 잡게 하는 기준표(지금 계획이 속한 줄을 강조합니다).
const GUIDE = [
  { min: 200, text: '200개 이상 - 평범하게 도달 가능한 수치입니다.' },
  { min: 1000, text: '1000개 이상 - 많은 노력이 들어갑니다.' },
  { min: 10000, text: '1만개 이상 - 사실상 불가능한 수준입니다.' },
]

export default function TunerGuide({ attempts }) {
  return (
    <div className="tuner-guide">
      <ul>
        {GUIDE.map((g, i) => {
          const on = attempts >= g.min && attempts < (GUIDE[i + 1]?.min ?? Infinity)
          return (
            <li key={g.min} className={on ? 'tuner-guide--on' : ''}>
              {g.text}
            </li>
          )
        })}
      </ul>
      <p className="tuner-guide__worst">최악에는 평균이 없습니다.</p>
    </div>
  )
}
