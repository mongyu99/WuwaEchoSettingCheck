import { assetPath } from './assetPath'

// 슬라이드에 넣을 배너 이미지들입니다. raw-banners/에 넣고 npm run prepare-banners로
// 변환한 뒤, 여기 images 배열에 경로를 추가하면 자동으로 슬라이드에 섞여 넘어갑니다.
// endsAt은 버전 자체의 종료가 아니라 "패스(전투 통행증) 종료" 기준입니다 — 실제로
// 플레이어가 신경 쓰는 마감이 패스 쪽이라서요. 정확한 날짜/시간을 알려주시면 채워넣겠습니다.
export const VERSION_BANNER = {
  version: '3.6',
  title: '신기루 속 등불 그림자, 속세에 깃든 검의 결심',
  images: [assetPath('banners/3.6.webp')],
  startsAt: '2026-08-20T10:00:00+09:00',
  endsAt: '2026-09-30T10:00:00+09:00', // 시작일 + 41일
}
