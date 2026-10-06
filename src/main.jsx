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
  .catch((err) => {
    console.error(err)
    root.render(
      <p style={{ padding: 24, color: 'var(--text-muted)' }}>
        데이터를 불러오지 못했어요. 잠시 후 새로고침해주세요.
      </p>,
    )
  })
