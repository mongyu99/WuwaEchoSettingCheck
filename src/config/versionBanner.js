import { assetPath } from './assetPath'

const DAY_MS = 24 * 60 * 60 * 1000

function addDays(isoDateTime, days) {
  return new Date(new Date(isoDateTime).getTime() + days * DAY_MS).toISOString()
}

const STARTS_AT = '2026-09-30T10:00:00+09:00'
const PASS_DURATION_DAYS = 41

// 슬라이드에 넣을 배너 이미지들입니다. raw-banners/에 넣고 npm run prepare-banners로
// 변환한 뒤, 여기 images 배열에 경로를 추가하면 자동으로 슬라이드에 섞여 넘어갑니다.
export const VERSION_BANNER = {
  version: '3.6',
  title: '메인 배너',
  images: [assetPath('banners/3.7.webp')],
  startsAt: STARTS_AT,
  endsAt: addDays(STARTS_AT, PASS_DURATION_DAYS),
}
