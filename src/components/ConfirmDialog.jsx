import './ConfirmDialog.css'

export default function ConfirmDialog({ open, title, message, confirmLabel = '예', cancelLabel = '아니요', onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="confirm-dialog" role="dialog" aria-modal="true">
      <div className="confirm-dialog__backdrop" onClick={onCancel} />
      <div className="confirm-dialog__card">
        {title && <h3 className="confirm-dialog__title">{title}</h3>}
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button className="btn btn--ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn--primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
