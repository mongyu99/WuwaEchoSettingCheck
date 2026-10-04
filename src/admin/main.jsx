import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './AdminApp.jsx'
import '../index.css'
import './admin.css'

// 개발 서버(npm run dev)에서만 화면을 그립니다. admin.html은 운영 빌드 입력에 없지만, 혹시 포함돼도 빈 화면입니다.
if (import.meta.env.DEV) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>,
  )
}
