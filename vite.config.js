import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages에 배포할 때는 저장소 이름으로 base를 맞춰줘야 합니다.
// 예: https://<username>.github.io/wuwa-echo-setting-check/
// 로 배포한다면 base를 '/wuwa-echo-setting-check/' 로 바꿔주세요.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    watch: {
      // Visual Studio가 생성하는 .vs 폴더 안 인덱스 파일이 잠겨 있어
      // Vite의 파일 감시가 EBUSY 에러를 내는 것을 방지합니다.
      // Docker 개발 서버는 폴더를 주기적으로 훑어(polling) 변경을 찾으므로, 소스 외 폴더는 감시에서 뺍니다.
      ignored: [
        '**/.vs/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/backend/**',
        '**/dist/**',
        '**/archive/**',
        '**/raw-*/**',
        '**/public/**',
      ],
    },
  },
})
