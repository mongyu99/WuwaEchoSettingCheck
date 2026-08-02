// GitHub Pages처럼 하위 경로(예: /WuwaEchoSettingCheck/)에 배포될 때도 이미지가 깨지지 않도록,
// "/characters/x.webp" 같은 루트 절대경로 대신 이 함수로 감싸서 씁니다. vite.config.js의 base
// 설정(현재 './')을 그대로 따라가므로, base를 바꿔도 여기는 손댈 필요 없습니다.
export function assetPath(relativePath) {
  return `${import.meta.env.BASE_URL}${relativePath}`
}
