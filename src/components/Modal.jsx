import { useScrollLock } from '../utils/useScrollLock'
import './Modal.css'

// wide: 고르는 목록 팝업입니다. PC에서 화면을 넓게 쓰고 항목을 카드로 나열합니다.
// className: 팝업마다 따로 붙일 클래스(예: 높이 고정)
export default function Modal({ open, title, onClose, wide = false, className = '', children }) {
  useScrollLock(open)
  if (!open) return null
  return (
    <div className={`modal ${wide ? 'modal--wide' : ''} ${className}`} role="dialog" aria-modal="true">
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
