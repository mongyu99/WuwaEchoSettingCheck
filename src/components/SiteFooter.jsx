import { INFO_SECTIONS } from '../config/legalNotices'
import './SiteFooter.css'

import { CONTACT_URL } from '../config/contact'
// 제작자(몽유) 유튜브 주소입니다.
const MAKER_YOUTUBE_URL = 'https://www.youtube.com/@MongYu99';
// 사이트 소스 코드(깃허브 저장소) 주소입니다.
const SOURCE_CODE_URL = 'https://github.com/mongyu99/WuwaEchoSettingCheck';
// 셸라스님 유튜브 주소입니다. 비어 있으면 이름만 글자로 보여 줍니다.
const SHELLAS_YOUTUBE_URL = 'https://www.youtube.com/@%EC%85%B8%EB%9D%BC%EC%8A%A4';

export default function SiteFooter({ onOpenInfo }) {
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
          {/* 누르면 안내 페이지의 그 항목으로 */}
          {INFO_SECTIONS.map((s) => (
            <button key={s.key} className="site-footer__link" onClick={() => onOpenInfo?.(s.key)}>
              {s.title}
            </button>
          ))}
          {CONTACT_URL && (
            <a className="site-footer__link" href={CONTACT_URL} target="_blank" rel="noreferrer">
              문의
            </a>
          )}
        </div>

        {/* 크레딧: 오른쪽 끝에 크게 */}
        <div className="site-footer__credit-box">
          <span className="site-footer__heading">Credit</span>
          <p className="site-footer__credit-text">
            제작자 :{' '}
            <a className="site-footer__credit" href={MAKER_YOUTUBE_URL} target="_blank" rel="noreferrer">
              몽유 ↗
            </a>
            {' · '}
            <a className="site-footer__credit" href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </p>
          <p className="site-footer__credit-text">
            초기 기획 및 영감에 도움을 주신{' '}
            {SHELLAS_YOUTUBE_URL ? (
              <a className="site-footer__credit" href={SHELLAS_YOUTUBE_URL} target="_blank" rel="noreferrer">
                셸라스님 ↗
              </a>
            ) : (
              <span className="site-footer__credit">셸라스님</span>
            )}
          </p>
        </div>
      </footer>

    </>
  )
}
