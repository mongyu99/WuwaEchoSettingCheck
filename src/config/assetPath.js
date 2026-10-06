// 이미지 주소를 만듭니다. VITE_ASSET_BASE_URL(예: Cloudflare 이미지 주소)이 있으면 그 뒤에 붙이고,
// 없으면 사이트의 public/ 폴더(vite.config.js의 base)를 씁니다. DB에는 'characters/jiyan.webp' 같은
// 상대 경로만 저장하므로, 이미지 저장소를 옮길 때는 이 환경변수만 바꾸면 됩니다.
const ASSET_BASE = import.meta.env.VITE_ASSET_BASE_URL || import.meta.env.BASE_URL

export function assetPath(relativePath) {
  return `${ASSET_BASE.replace(/\/?$/, '/')}${relativePath}`
}
