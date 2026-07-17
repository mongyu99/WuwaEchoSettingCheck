import './InfoTooltip.css'

export default function InfoTooltip({ children }) {
  return (
    <span className="info-tooltip" tabIndex={0}>
      <span className="info-tooltip__icon" aria-hidden="true">i</span>
      <span className="info-tooltip__panel">{children}</span>
    </span>
  )
}
