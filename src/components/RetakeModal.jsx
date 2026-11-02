import { useState } from 'react'
import Modal from './Modal'
import ScreenCapture, { screenCaptureSupported } from './ScreenCapture'
import './ImageUploader.css'

/** 에코 한 개를 다시 찍습니다. 처음 등록할 때와 같이 사진 업로드나 화면 공유로 한 장을 받아 onSubmit으로 넘깁니다. */
export default function RetakeModal({ open, title, onClose, onSubmit }) {
  const [mode, setMode] = useState(screenCaptureSupported ? null : 'upload')

  const close = () => {
    setMode(screenCaptureSupported ? null : 'upload')
    onClose()
  }

  const submit = (file) => {
    if (!file) return
    close()
    onSubmit(file)
  }

  return (
    <Modal open={open} title={title} onClose={close}>
      {mode === null && (
        <div className="uploader__modes">
          <button type="button" className="uploader__mode" onClick={() => setMode('upload')}>
            <strong>스크린샷</strong>
            <span>저장한 사진으로 업로드 할게요.</span>
          </button>
          <button type="button" className="uploader__mode" onClick={() => setMode('share')}>
            <strong>PC 공유</strong>
            <span>화면 공유로 실시간 업로드 할게요.</span>
          </button>
        </div>
      )}

      {mode !== null && screenCaptureSupported && (
        <button type="button" className="btn btn--ghost uploader__mode-back" onClick={() => setMode(null)}>
          ← 뒤로
        </button>
      )}

      {mode === 'share' && <ScreenCapture onCapture={submit} remaining={1} />}

      {mode === 'upload' && (
        <label
          className="uploader__drop"
          onDrop={(e) => {
            e.preventDefault()
            submit(e.dataTransfer.files?.[0])
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              submit(e.target.files?.[0])
              e.target.value = ''
            }}
            hidden
          />
          <span>이미지 선택 또는 드래그해서 놓기</span>
        </label>
      )}
    </Modal>
  )
}
