import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Modal from './Modal'
import { downloadBackup, parseBackup } from '../utils/backup'
import './BackupPanel.css'

/**
 * 로그인 없이 세팅을 JSON 파일로 백업하고 복원합니다. 상단바 버튼 하나로 창을 열어 두 기능을 한곳에서 씁니다.
 * 상단바(backdrop-filter)·모바일 서랍(transform) 안에서는 fixed 창이 화면 기준으로 뜨지 않아서 body에 그립니다.
 */
export default function BackupPanel({ characterData, onLoadData }) {
  const fileRef = useRef(null)
  const [open, setOpen] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 골라도 동작하도록 비웁니다.
    if (!file) return
    try {
      const data = parseBackup(await file.text())
      if (!window.confirm('현재 저장된 세팅을 백업 파일 내용으로 덮어씁니다. 계속할까요?')) return
      onLoadData(data)
      setOpen(false)
      window.alert('백업을 불러왔어요.')
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <>
      <button className="top-nav__link" title="세팅을 JSON 파일로 백업하거나 복원합니다" onClick={() => setOpen(true)}>
        백업 / 복원
      </button>
      {createPortal(
        <Modal open={open} title="백업 / 복원" onClose={() => setOpen(false)}>
          <div className="backup-panel">
            <section className="backup-panel__item">
              <h4>백업</h4>
              <p>지금 이 브라우저에 저장된 세팅을 JSON 파일로 내려받아요.</p>
              <button className="btn btn--primary" onClick={() => downloadBackup(characterData)}>
                백업 파일 내려받기
              </button>
            </section>
            <section className="backup-panel__item">
              <h4>복원</h4>
              <p>내려받아 둔 백업 파일로 세팅을 되돌려요. 지금 세팅은 덮어써져요.</p>
              <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
                백업 파일 불러오기
              </button>
              <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
            </section>
          </div>
        </Modal>,
        document.body,
      )}
    </>
  )
}
