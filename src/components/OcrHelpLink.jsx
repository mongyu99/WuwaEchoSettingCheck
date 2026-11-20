import { CONTACT_URL } from '../config/contact'
import './OcrHelpLink.css'

/** 인식 화면 오른쪽 위의 "인식이 잘 안되나요?" — 문의 폼으로 연결합니다. */
export default function OcrHelpLink() {
  if (!CONTACT_URL) return null
  return (
    <a className="ocr-help-link" href={CONTACT_URL} target="_blank" rel="noreferrer">
      인식이 잘 안되나요?
    </a>
  )
}
