const DAY_MS = 24 * 60 * 60 * 1000

function addDays(isoDateTime, days) {
  return new Date(new Date(isoDateTime).getTime() + days * DAY_MS).toISOString()
}

const STARTS_AT = '2026-09-30T10:00:00+09:00'
const PASS_DURATION_DAYS = 41

// 메인 배너와 버전 타이머는 관리자 페이지에서 등록한 배너의 기간(/api/banners)을 씁니다.
// 아래는 그 조회가 실패했을 때만 쓰는 로컬 대체 배너(public/main/)와 기간입니다.
export const FALLBACK_BANNERS = [
  {
    id: 'fallback',
    title: '메인 배너',
    imagePath: 'main/3.7.webp',
    startsAt: STARTS_AT,
    endsAt: addDays(STARTS_AT, PASS_DURATION_DAYS),
  },
]
