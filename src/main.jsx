import React from 'react'
import ReactDOM from 'react-dom/client'
import { loadCatalog } from './config/catalog'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

// 게임 기준 데이터(캐릭터·무기·에코)를 DB에서 먼저 받아온 뒤 앱을 불러옵니다. config 모듈들이
// 불러오는 순간 이 데이터를 읽기 때문에, App은 로딩이 끝난 다음에 동적으로 import합니다.
loadCatalog()
  .then(async () => {
    const [{ default: App }, { AuthProvider }] = await Promise.all([
      import('./App.jsx'),
      import('./context/AuthContext.jsx'),
    ])
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>,
    )
  })
  // 서버(Redis·DB·백업 파일)가 모두 응답하지 못하거나 API 서버에 닿지 못하면 점검 안내를 띄웁니다.
  .catch((err) => {
    console.error(err)
    root.render(
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>점검 중입니다</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          잠시 후 다시 접속해 주세요.
        </p>
      </div>,
    )
  })
