/**
 * 캐릭터 선택 화면에 쓰는 데이터입니다.
 *
 * image 경로의 사진들은 public/characters/ 안에 있고, scripts/prepare-character-images.mjs로
 * 무조건 610x840 크기로 리사이즈된 것입니다. 새 캐릭터를 추가하려면:
 *   1. raw-characters/ 폴더에 원본 사진을 넣고
 *   2. `npm run prepare-characters` 실행 (public/characters/에 610x840으로 리사이즈된 결과가 생김)
 *   3. 아래 배열에 항목 추가
 *
 * element(속성)는 현재 6가지(응결/용융/전도/기류/회절/인멸) 중 하나입니다.
 * initials/color는 사진이 없거나 로드에 실패했을 때 대신 보여줄 이니셜 아바타용입니다.
 */
export const ELEMENTS = ['응결', '용융', '전도', '기류', '회절', '인멸']

export const CHARACTERS = [
  { id: 'deni', name: '데니아', element: '전도', image: '/characters/deni.png', initials: 'DN', color: '#f472b6' },
  { id: 'yangyang', name: '양양·현령', element: '기류', image: '/characters/yangyang.png', initials: 'YY', color: '#6ee7f9' },
]
