// 사용자가 마지막으로 본 패치노트 id를 이 기기에 기억합니다. 새 글이 올라오면 상단바 "패치노트"에 1 표시를 띄우는 데 씁니다.
const KEY = 'wuwa-patchnote-seen'

// 처음 온 사람인지: 앱 상태(persist.js의 STORAGE_KEY)가 저장돼 있으면 전에 와 본 사람입니다.
// App이 첫 화면을 그리자마자 상태를 저장하므로, 그 전에(이 파일을 불러오는 순간) 한 번만 확인해 둡니다.
const FIRST_VISIT = (() => {
  try {
    return localStorage.getItem('wuwa-echo-check:v1') === null
  } catch {
    return false
  }
})()

/** 처음 온 사람에게는 지난 패치노트를 "새 글"로 띄우지 않습니다(다음 새 글부터 표시). */
export const isFirstVisit = () => FIRST_VISIT

export function loadSeenPatchNote() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveSeenPatchNote(id) {
  try {
    localStorage.setItem(KEY, String(id))
  } catch {
    // localStorage를 못 쓰면 표시가 매번 다시 뜰 뿐 동작에는 문제없습니다.
  }
}
