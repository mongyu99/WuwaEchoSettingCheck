const STORAGE_KEY = 'wuwa-echo-check:v1'

/** 현재 진행 상태를 localStorage에 저장합니다. 저장 실패(용량 초과 등)해도 앱은 계속 동작합니다. */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('상태 저장에 실패했어요.', err)
  }
}

/** 저장된 상태를 불러옵니다. 저장된 게 없거나 손상됐으면 null을 반환합니다. */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error('저장된 상태를 불러오는 데 실패했어요.', err)
    return null
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('저장된 상태를 지우는 데 실패했어요.', err)
  }
}
