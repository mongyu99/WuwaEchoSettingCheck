/**
 * 화면(page)과 주소(path)를 잇는 표입니다. 검색 엔진이 화면마다 따로 찾을 수 있게 주소를 나눴습니다.
 * - App.jsx: 화면이 바뀌면 주소·제목·설명을 바꾸고, 처음 열 때 주소로 화면을 고릅니다.
 * - vite.config.js: 빌드할 때 주소마다 제목·설명이 들어간 HTML(dist/<이름>.html)을 따로 만듭니다(JS를 못 돌리는 봇용).
 * - nginx.conf, public/sitemap.xml: 여기 path를 바꾸면 같이 바꿔야 합니다.
 * 주소는 public/ 폴더 이름(characters, events, guide …)과 겹치지 않게 지었습니다.
 */
export const SITE_URL = 'https://wuwaechocheck.com'
export const SITE_NAME = '명체크'

const DEFAULT_DESCRIPTION = '명조 에코 스크린샷으로 점수를 매기고, 게임 화면을 공유하면 에코가 뜰 때마다 바로 비교해 주는 사이트예요.'

export const ROUTES = [
  { page: 'home', path: '/', title: '명체크 | 실시간 에코 강화 확률 계산기', description: DEFAULT_DESCRIPTION },
  { page: 'characters', path: '/build', title: '캐릭터 빌드 체크 - 명체크', description: '명조 캐릭터 에코 스크린샷을 올리면 서브 옵션을 읽어 점수와 최종 스탯, 교체 우선순위를 알려 줘요.' },
  { page: 'live', path: '/live-check', title: '실시간 에코 체크 - 명체크', description: '게임 화면을 공유해 두면 에코를 강화할 때마다 옵션을 읽어, 지금 세팅보다 좋은지 바로 비교해 줘요.' },
  { page: 'bag', path: '/echo-bag', title: '에코 가방 스캔 - 명체크', description: '화면을 공유한 채 에코 가방을 넘기면 강화 완료된 에코를 한 번에 읽어 정리해 줘요.' },
  { page: 'recommend', path: '/recommend', title: '캐릭터 에코 추천 - 명체크', description: '에코 가방에 모은 에코 중에서 캐릭터의 메인 에코와 추천 세트를 맞추고, 점수가 가장 높은 5개를 골라 줘요.' },
  { page: 'events', path: '/event-calendar', title: '명조 이벤트 캘린더 - 명체크', description: '명조 진행 중인 이벤트와 이번 버전 이벤트 노트를 한곳에서 봐요.' },
  { page: 'eventnote', path: '/event-note', title: '명조 이벤트 일정 - 명체크', description: '명조 진행 중이거나 예정된 이벤트 일정을 타임라인으로 한눈에 봐요.' },
  { page: 'patchnotes', path: '/patch-notes', title: '업데이트 내역 - 명체크', description: '명체크에 새로 생긴 기능과 바뀐 점이에요.' },
  { page: 'guide', path: '/help', title: '사용 가이드 - 명체크', description: '스크린샷 올리기부터 점수 보기, 실시간 에코 체크까지 사용법을 그림으로 안내해요.' },
  { page: 'info', path: '/info', title: '자주 묻는 질문 - 명체크', description: '명체크 자주 묻는 질문, 저작권, 개인정보처리방침, 이용약관이에요.' },
]

// 캐릭터를 고른 뒤 이어지는 화면들(캡처·수정·결과·최적화)은 캐릭터 상태에 달려 있어 주소를 따로 두지 않고 /build를 씁니다.
const BUILD_FLOW = ['capture', 'edit', 'stats', 'optimize']
export const isBuildFlow = (page) => BUILD_FLOW.includes(page)

const byPage = Object.fromEntries(ROUTES.map((r) => [r.page, r]))

export const routeOf = (page) => byPage[isBuildFlow(page) ? 'characters' : page] ?? byPage.home

/** 주소로 화면을 찾습니다. 모르는 주소면 null. 끝의 / 와 .html은 무시합니다(/help/ , /help.html). */
export function pageFromPath(pathname) {
  const clean = (pathname || '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/'
  if (clean === '/index') return 'home'
  return ROUTES.find((r) => r.path === clean)?.page ?? null
}
