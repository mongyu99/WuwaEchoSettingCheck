import { assetPath } from './assetPath'

// 픽업 배너는 관리자 페이지 '픽업 배너' 탭에서 기간을 정해 활성화합니다(/api/pickups).
// 이 목록은 그 조회가 실패했을 때만 쓰는 로컬 대체 이미지입니다(public/banners/).
// 파일명은 '{캐릭터}_banner' 규칙을 지킵니다. 예: assetPath('banners/cartethyia_banner.webp'),
export const PICKUP_IMAGES = [
  assetPath('banners/suoming_banner.webp'),
  assetPath('banners/lynae_banner.webp'),
  assetPath('banners/lucilla_banner.webp'),
]
