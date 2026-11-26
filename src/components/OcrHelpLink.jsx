import { useState } from 'react'
import Modal from './Modal'
import { CONTACT_URL } from '../config/contact'
import './OcrHelpLink.css'

// 인식이 잘 안될 때 확인할 것들(팝업에 순서대로 보여 줍니다).
const TIPS = [
  '덩치가 큰 에코는 인식이 안 되거나 틀리게 읽힐 수 있어요. 인식 결과를 꼭 확인하고, 틀린 곳은 직접 고쳐 주세요.',
  '특정 부분을 크롭한게 아니라, 전체화면을 캡쳐해주세요.',
  '만약 스탯 부분으로 에코가 넘어온다면, 하단에 있는 비교 버튼을 눌러 캡쳐해주세요.',
  '마우스 커서나 다른 창이 에코 옵션을 가리지 않게 해주세요.',
  '게임 창을 너무 작게 두면 글자가 뭉개져요. 창을 크게 두거나 전체 화면으로 해주세요.',
  'HDR이 켜져 있으면 화면 색이 달라져 인식이 안 될 수 있어요. 게임 그래픽 설정과 윈도우 디스플레이 설정에서 HDR을 꺼 주세요.',
  '강화 연출이나 화면이 넘어가는 중에는 못 읽을 수 있어요. 화면이 멈춘 뒤에 다시 확인해주세요.',
]

/** 인식 화면 오른쪽 위의 "인식이 잘 안되나요?" — 확인할 것들을 팝업으로 보여 주고, 마지막에 문의로 연결합니다. */
export default function OcrHelpLink() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="ocr-help-link" onClick={() => setOpen(true)}>
        인식이 잘 안되나요?
      </button>
      <Modal open={open} title="인식이 잘 안되나요?" onClose={() => setOpen(false)}>
        <ol className="ocr-help__tips">
          {TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
        <p className="ocr-help__contact">
          그래도 잘 안되나요? 문의로 남겨주세요!
          {CONTACT_URL && (
            <a className="btn btn--primary ocr-help__contact-btn" href={CONTACT_URL} target="_blank" rel="noreferrer">
              문의 남기기
            </a>
          )}
        </p>
      </Modal>
    </>
  )
}
