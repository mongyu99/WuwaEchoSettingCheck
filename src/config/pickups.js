import { assetPath } from './assetPath'

// 홈 '픽업 일정' 슬라이드 이미지. public/banners/ 에 webp로 넣고 순서대로 추가합니다.
// 파일명은 '{캐릭터}_banner' 규칙을 지킵니다. 예: assetPath('banners/cartethyia_banner.webp'),
export const PICKUP_IMAGES = [
  assetPath('banners/suoming_banner.webp'),
  assetPath('banners/lynae_banner.webp'),
  assetPath('banners/lucilla_banner.webp'),
]
