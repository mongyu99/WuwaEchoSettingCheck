import { useState } from 'react'
import Modal from './Modal'
import { LEGAL_NOTICES } from '../config/legalNotices'
import './SiteFooter.css'

// 문의용 구글폼 주소입니다. 비어 있으면 문의 링크를 숨깁니다.
const CONTACT_URL = 'https://forms.gle/BtbnCm8TpnsTFDp7A';

export default function SiteFooter() {
  const [openKey, setOpenKey] = useState(null)
  const active = openKey ? LEGAL_NOTICES[openKey] : null

  return (
    <>
      <footer className="site-footer">
        <div className="site-footer__col">
          <strong className="site-footer__brand">ECHO CHECK</strong>
          <p className="site-footer__note">비공식 팬 제작 도구입니다.</p>
          <p className="site-footer__note">게임 이미지 저작권은 Kuro Games에 있습니다.</p>
        </div>

        <div className="site-footer__col">
          <span className="site-footer__heading">안내</span>
          <button className="site-footer__link" onClick={() => setOpenKey('copyright')}>
            저작권 안내
          </button>
          <button className="site-footer__link" onClick={() => setOpenKey('privacy')}>
            개인정보처리방침
          </button>
          <button className="site-footer__link" onClick={() => setOpenKey('terms')}>
            이용약관
          </button>
          {CONTACT_URL && (
            <a className="site-footer__link" href={CONTACT_URL} target="_blank" rel="noreferrer">
              문의
            </a>
          )}
        </div>
      </footer>

      <Modal open={!!active} title={active?.title} onClose={() => setOpenKey(null)}>
        {active?.body.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </Modal>
    </>
  )
}
