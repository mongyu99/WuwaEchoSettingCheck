import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { loginUrl, fetchCloudState, saveCloudState } from '../utils/api'
import './AuthPanel.css'

/** 소셜 로그인 상태 표시 + 클라우드 저장/불러오기 버튼입니다. characterData를 그대로 JSON
 * 문자열로 백엔드에 업/다운로드해서, 다른 기기에서도 같은 로그인으로 이어볼 수 있게 합니다. */
export default function AuthPanel({ characterData, onLoadCloudData }) {
  const { user, loading, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  if (loading) return null

  if (!user) {
    return (
      <div className="auth-panel">
        <a className="auth-panel__login" href={loginUrl('google')}>
          Google로 로그인
        </a>
      </div>
    )
  }

  const handleSave = async () => {
    setBusy(true)
    setMessage('')
    try {
      await saveCloudState(JSON.stringify(characterData))
      setMessage('저장했어요.')
    } catch (err) {
      setMessage(err.message || '저장에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  const handleLoad = async () => {
    setBusy(true)
    setMessage('')
    try {
      const { data } = await fetchCloudState()
      if (!data) {
        setMessage('저장된 클라우드 데이터가 없어요.')
        return
      }
      onLoadCloudData(JSON.parse(data))
      setMessage('불러왔어요.')
    } catch (err) {
      setMessage(err.message || '불러오기에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-panel">
      <span className="auth-panel__user">{user.nickname ?? user.email}</span>
      <button className="auth-panel__btn" onClick={handleSave} disabled={busy}>
        클라우드에 저장
      </button>
      <button className="auth-panel__btn" onClick={handleLoad} disabled={busy}>
        클라우드에서 불러오기
      </button>
      <button className="auth-panel__btn auth-panel__btn--ghost" onClick={logout} disabled={busy}>
        로그아웃
      </button>
      {message && <span className="auth-panel__message">{message}</span>}
    </div>
  )
}
