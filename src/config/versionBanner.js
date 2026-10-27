const DAY_MS = 24 * 60 * 60 * 1000

function addDays(isoDateTime, days) {
  return new Date(new Date(isoDateTime).getTime() + days * DAY_MS).toISOString()
}

const STARTS_AT = '2026-09-30T10:00:00+09:00'
const PASS_DURATION_DAYS = 41

// /api/banners 조회가 실패했을 때 대신 띄우는 배너(public/main/ 안의 파일).
export const FALLBACK_BANNERS = [{ id: 'fallback', title: '메인 배너', imagePath: 'main/3.7.webp', url: null }]

// 버전 기간(VersionTimer가 씀). 메인 배너 이미지는 관리자 페이지에서 기간별로 등록하고 /api/banners로 받아옵니다.
export const VERSION_BANNER = {
  version: '3.6',
  startsAt: STARTS_AT,
  endsAt: addDays(STARTS_AT, PASS_DURATION_DAYS),
}
