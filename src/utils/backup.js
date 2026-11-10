// 로그인하지 않는 사용자도 세팅을 잃지 않도록 JSON 파일로 내보내고 다시 불러옵니다.
// 나중에 데이터 구조가 바뀌어도 예전 백업을 읽을 수 있게 version을 함께 씁니다.
export const BACKUP_VERSION = 1

/** 백업 파일에 담을 내용을 만듭니다. */
export function createBackup(characterData, now = new Date()) {
  return { version: BACKUP_VERSION, savedAt: now.toISOString(), characterData }
}

/** 백업 파일 이름입니다. 예: wuwa-echo-backup-2026-11-09.json */
export function backupFileName(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `wuwa-echo-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

/** 백업 파일 내용을 읽어 characterData를 돌려줍니다. 형식이 맞지 않으면 에러를 던집니다. */
export function parseBackup(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('JSON 파일을 읽을 수 없어요.')
  }
  const data = parsed?.characterData
  if (!parsed || typeof parsed.version !== 'number' || !data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('명체크 백업 파일이 아니에요.')
  }
  if (parsed.version > BACKUP_VERSION) {
    throw new Error('더 새로운 버전에서 만든 백업이에요. 새로고침 후 다시 시도해 주세요.')
  }
  return data
}

/** 브라우저에서 백업 파일을 내려받습니다. */
export function downloadBackup(characterData) {
  const now = new Date()
  const blob = new Blob([JSON.stringify(createBackup(characterData, now), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFileName(now)
  a.click()
  URL.revokeObjectURL(url)
}
