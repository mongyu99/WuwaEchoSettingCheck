// 빌드 체크 화면(캐릭터 선택~결과)은 아직 모바일 배치가 없어서, 모바일에서는 PC 화면 폭으로 그린 뒤
// 브라우저가 화면에 맞게 축소해서 보여주게 합니다. PC 브라우저는 viewport 메타를 무시하므로 영향이 없습니다.
const DESKTOP_VIEWPORT = 'width=1280'
const DEVICE_VIEWPORT = 'width=device-width, initial-scale=1.0'

export function applyDesktopViewport(enabled) {
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return
  const content = enabled ? DESKTOP_VIEWPORT : DEVICE_VIEWPORT
  if (meta.getAttribute('content') !== content) meta.setAttribute('content', content)
}
