import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './UsageGuide.css'

// 빌드 체크 업로드 사용법: 화면의 한 부분만 밝게 보여 주고 나머지는 어둡게 가린 채, 한 단계씩 [다음]으로 안내합니다.
// target은 화면 요소의 data-tour 값입니다.
const STEPS = [
  { target: 'hint', title: '게임에서 에코 화면 열기', body: '캐릭터 → 에코 → 교체 화면에서 에코를 첫 번째부터 순서대로 눌러 주세요.' },
  { target: 'upload', title: '스크린샷', body: '미리 찍어 둔 사진을 올려요. 일부만 자르지 말고 전체 화면으로 찍어 주세요. (최대 5장)' },
  { target: 'share', title: 'PC 공유', body: '게임 화면을 공유하고, 에코를 띄울 때마다 캡처 버튼을 눌러요.' },
  { target: 'auto', title: '자동 캡처', body: '게임 화면을 공유해 두면, 새 에코가 보일 때마다 알아서 찍어요.' },
]
const PAD = 6

export default function UsageGuide() {
  const [step, setStep] = useState(null) // null = 닫힘
  const [rect, setRect] = useState(null)
  const s = step === null ? null : STEPS[step]

  useLayoutEffect(() => {
    if (!s) return
    const el = document.querySelector(`[data-tour="${s.target}"]`)
    if (!el) return setRect(null)
    el.scrollIntoView({ block: 'center', behavior: 'instant' })
    const measure = () => setRect(el.getBoundingClientRect())
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [s])

  useEffect(() => {
    if (step === null) return
    const onKey = (e) => e.key === 'Escape' && setStep(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  const last = step === STEPS.length - 1
  // 말풍선은 밝힌 부분 아래에, 아래 공간이 부족하면 위에 둡니다.
  const below = rect && rect.bottom + 180 < window.innerHeight
  const tipStyle = rect
    ? {
        top: below ? rect.bottom + PAD + 12 : undefined,
        bottom: below ? undefined : window.innerHeight - rect.top + PAD + 12,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 336)),
      }
    : { top: '40%', left: '50%', transform: 'translateX(-50%)' }

  return (
    <>
      <button type="button" className="usage-guide__open" onClick={() => setStep(0)}>
        사용법
      </button>
      {s &&
        createPortal(
          <div className="usage-tour" role="dialog" aria-label="사용법">
            {/* 밝힌 칸 바깥을 큰 그림자로 어둡게 덮습니다. 바깥을 누르면 닫혀요. */}
            <div className="usage-tour__catch" onClick={() => setStep(null)} />
            {rect && (
              <div
                className="usage-tour__hole"
                style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
              />
            )}
            <div className="usage-tour__tip" style={tipStyle}>
              <p className="usage-tour__count">
                {step + 1} / {STEPS.length}
              </p>
              <h4>{s.title}</h4>
              <p className="usage-tour__body">{s.body}</p>
              <div className="usage-tour__nav">
                <button type="button" className="usage-tour__skip" onClick={() => setStep(null)}>
                  건너뛰기
                </button>
                <span>
                  {step > 0 && (
                    <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>
                      이전
                    </button>
                  )}
                  <button type="button" className="btn btn--primary" onClick={() => setStep(last ? null : step + 1)}>
                    {last ? '확인' : '다음'}
                  </button>
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
