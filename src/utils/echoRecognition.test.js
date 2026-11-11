import { describe, expect, it, vi } from 'vitest'

// 카탈로그(서버 데이터) 대신 메인 에코 이름 몇 개만 넣습니다.
vi.mock('../config/mainEchoes', () => ({
  MAIN_ECHOES: {
    a: { name: '천괴중루' },
    b: { name: '헤카테' },
    c: { name: '악몽 · 음험한 백로' },
    d: { name: '보이드 모스' },
  },
}))
vi.mock('../components/ScreenCapture', () => ({ findGameArea: () => ({}) }))

const { readEchoName } = await import('./echoRecognition')

// 아래 원문은 모두 실제 가방 화면 OCR 결과(test/ocr-fixtures)에서 가져왔습니다.
describe('readEchoName', () => {
  it('이름 위 잡음 줄("] 로")이 있어도 카탈로그 이름 줄을 고른다', () => {
    expect(readEchoName('] 로\n천괴중루                < ie')).toBe('천괴중루')
  })

  it('변형 앞부분이 다르면 비슷해도 다른 변형으로 바꾸지 않는다(이상 ≠ 악몽)', () => {
    expect(readEchoName('이상ㆍ음험한백로 | a')).toBe('이상 · 음험한백로')
  })

  it('이름 뒤 긴 공백 다음의 잡음은 버린다', () => {
    expect(readEchoName('보이드 모스             (후 /')).toBe('보이드 모스')
    expect(readEchoName('영광의 사자                 \\N Lk <')).toBe('영광의 사자')
  })

  it('한글이 적은 잡음 줄은 이름으로 쓰지 않는다', () => {
    expect(readEchoName('Ham 6547~래래')).toBeNull()
  })

  it('카탈로그에 없으면 가장 긴 줄을 쓰고, 가운뎃점은 " · "로 맞춘다', () => {
    expect(readEchoName('공명의 메아리ㆍ악몽 아담 ~스매셔')).toBe('공명의 메아리 · 악몽 아담 · 스매셔')
    expect(readEchoName('느 ㅇ르\n돌아갈 곳이없는오류 _')).toBe('돌아갈 곳이없는오류')
  })

  it('뒤에 붙은 한글 없는 토막과 -로 읽힌 가운뎃점을 처리한다', () => {
    expect(readEchoName('악몽ㆍ반디의 군세 TA WAVE')).toBe('악몽 · 반디의 군세')
    expect(readEchoName('이상-무망자 NW /,')).toBe('이상 · 무망자')
    expect(readEchoName('이상ㆍ-무망자 NW /,')).toBe('이상 · 무망자')
  })

  it('한글이 없으면 null', () => {
    expect(readEchoName('|| 3 ~')).toBeNull()
  })
})
