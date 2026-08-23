const STORAGE_KEY = 'wuwa-echo-check:theme'

export function loadTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage를 못 쓰는 환경이면 이번 세션 동안만 테마가 적용됩니다.
  }
}
