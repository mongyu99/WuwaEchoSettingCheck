import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages에 배포할 때는 저장소 이름으로 base를 맞춰줘야 합니다.
// 예: https://<username>.github.io/wuwa-echo-setting-check/
// 로 배포한다면 base를 '/wuwa-echo-setting-check/' 로 바꿔주세요.
// OCR 샘플 저장 플러그인(scripts/)은 개발 서버에서만 불러옵니다.
// 운영 이미지 빌드는 scripts/ 폴더를 복사하지 않으므로(.dockerignore) 빌드 때는 아예 읽지 않습니다.
// 빌드가 끝나면 화면 주소마다 제목·설명·대표 주소만 바꾼 HTML(dist/build.html, dist/live-check.html …)을 만듭니다.
// 화면 내용은 여전히 JS가 그리지만, JS를 못 돌리는 검색 봇(네이버 등)과 링크 미리보기도 화면별 제목·설명은 읽을 수 있습니다.
// nginx.conf가 /live-check 요청에 live-check.html을 내줍니다.
function routeHtmlPlugin() {
  let outDir = 'dist'
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  return {
    name: 'route-html',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    async closeBundle() {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const { ROUTES, SITE_URL } = await import(new URL('./src/config/routes.js', import.meta.url).href)
      const base = await fs.readFile(path.resolve(outDir, 'index.html'), 'utf8')
      for (const r of ROUTES) {
        if (r.path === '/') continue
        const title = esc(r.title)
        const desc = esc(r.description)
        const html = base
          .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta name="description" content=")[^"]*/, `$1${desc}`)
          .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
          .replace(/(<meta property="og:description" content=")[^"]*/, `$1${desc}`)
          .replace(/(<meta property="og:url" content=")[^"]*/, `$1${SITE_URL}${r.path}`)
          .replace(/(<link rel="canonical" href=")[^"]*/, `$1${SITE_URL}${r.path}`)
        await fs.writeFile(path.resolve(outDir, `${r.path.slice(1)}.html`), html)
      }
    },
  }
}

export default defineConfig(async ({ command }) => ({
  // 경로를 글자 그대로 쓰면 설정 파일을 묶을 때 미리 찾아 버려서, URL로 만들어 실행 중에만 불러옵니다.
  plugins: [react(), routeHtmlPlugin(), ...(command === 'serve' ? [(await import(new URL('./scripts/ocrSamplePlugin.js', import.meta.url).href)).default()] : [])],
  // 화면 주소(/live-check, /help/ …)에서도 JS·이미지를 사이트 루트 기준으로 찾도록 절대 경로를 씁니다('./'면 /help/assets/…로 찾음).
  base: '/',
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
      ],
    },
  },
}))
