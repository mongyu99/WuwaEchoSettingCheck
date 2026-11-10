import { describe, it, expect } from 'vitest'
import { BACKUP_VERSION, backupFileName, createBackup, parseBackup } from './backup'

describe('backup', () => {
  const data = { carlotta: { echoes: [{ id: 1, cost: 4 }] } }

  it('내보낸 백업을 그대로 다시 읽는다', () => {
    const text = JSON.stringify(createBackup(data))
    expect(parseBackup(text)).toEqual(data)
  })

  it('파일 이름에 날짜를 붙인다', () => {
    expect(backupFileName(new Date(2026, 10, 9))).toBe('wuwa-echo-backup-2026-11-09.json')
  })

  it('JSON이 아니면 에러', () => {
    expect(() => parseBackup('not json')).toThrow('JSON 파일을 읽을 수 없어요.')
  })

  it('명체크 백업 형식이 아니면 에러', () => {
    expect(() => parseBackup('{"foo":1}')).toThrow('명체크 백업 파일이 아니에요.')
    expect(() => parseBackup(JSON.stringify({ version: 1, characterData: [] }))).toThrow()
  })

  it('더 새로운 버전의 백업이면 에러', () => {
    const text = JSON.stringify({ version: BACKUP_VERSION + 1, characterData: data })
    expect(() => parseBackup(text)).toThrow('더 새로운 버전')
  })
})
