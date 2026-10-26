import { assetPath } from './assetPath'

// 홈 '픽업 일정' 슬라이드. 이미지는 public/banners/pickups/ 에 webp로 넣고 아래에 한 줄씩 추가합니다.
// 종료일(endsAt)이 지난 픽업은 자동으로 빠집니다.
// 예: { name: '카르티시아', image: assetPath('banners/pickups/cartethyia.webp'), startsAt: '2026-09-30T10:00:00+09:00', endsAt: '2026-10-21T09:59:00+09:00' },
export const PICKUPS = []
