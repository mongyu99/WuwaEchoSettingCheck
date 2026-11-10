import { useRef } from 'react'
import { downloadBackup, parseBackup } from '../utils/backup'

/** 로그인 없이 세팅을 JSON 파일로 백업하고 복원하는 버튼입니다. */
export default function BackupPanel({ characterData, onLoadData }) {
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 골라도 동작하도록 비웁니다.
    if (!file) return
    try {
      const data = parseBackup(await file.text())
      if (!window.confirm('현재 저장된 세팅을 백업 파일 내용으로 덮어씁니다. 계속할까요?')) return
      onLoadData(data)
      window.alert('백업을 불러왔어요.')
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <>
      <button
        className="top-nav__link"
        title="세팅을 JSON 파일로 내려받습니다"
        onClick={() => downloadBackup(characterData)}
      >
        백업
      </button>
      <button className="top-nav__link" title="JSON 백업 파일로 세팅을 되돌립니다" onClick={() => fileRef.current?.click()}>
        복원
      </button>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
    </>
  )
}
