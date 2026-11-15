// 애니메이션 켜기/끄기 설정입니다. 움직임을 싫어하는 사용자를 위해 상단바 스위치로 끕니다.
// 끄면 <html data-motion="off">를 달아 CSS 애니메이션을 모두 멈추고(index.css), JS 효과도 이 값을 보고 건너뜁니다.
// 기기의 "동작 줄이기" 설정이 켜져 있어도 꺼진 것으로 봅니다.
const STORAGE_KEY = 'wuwa-echo-check:motion'

export function loadMotion() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function applyMotion(on) {
  document.documentElement.setAttribute('data-motion', on ? 'on' : 'off')
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // localStorage를 못 쓰면 이번 방문 동안만 적용됩니다.
  }
}

/** 지금 애니메이션을 건너뛰어야 하면 true(스위치로 껐거나, 기기의 동작 줄이기 설정). */
export const motionOff = () =>
  document.documentElement.getAttribute('data-motion') === 'off' ||
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
