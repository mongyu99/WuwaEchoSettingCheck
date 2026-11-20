import './ProcessingOverlay.css'

/**
 * 스크린샷 인식 중 화면 위에 띄우는 진행 표시. 사이트 패널 디자인(유리판 + 금색 선)에 맞춰
 * 금색 마름모 장식 + 진행 막대로 보여 줍니다. character는 예전 호출부 호환용으로만 받습니다.
 */
// eslint-disable-next-line no-unused-vars
export default function ProcessingOverlay({ character, progress }) {
  const percent = Math.round((progress ?? 0) * 100)
  return (
    <div className="processing-overlay" role="status" aria-live="polite">
      <div className="processing-overlay__card">
        <span className="processing-overlay__mark" aria-hidden="true" />
        <p className="processing-overlay__label">에코 인식 중</p>
        <div className="processing-overlay__bar" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
        <p className="processing-overlay__percent">{percent}%</p>
      </div>
    </div>
  )
}
