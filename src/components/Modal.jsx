import './Modal.css'

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__card">
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
