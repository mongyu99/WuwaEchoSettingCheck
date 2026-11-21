import { useState } from 'react'
import { INFO_SECTIONS, INFO_UPDATED } from '../config/legalNotices'
import { CONTACT_URL } from '../config/contact'
import './InfoPage.css'

const SOURCE_CODE_URL = 'https://github.com/mongyu99/WuwaEchoSettingCheck'

/** 하단 "안내"에서 여는 페이지: 자주 묻는 질문 · 저작권 · 개인정보처리방침 · 이용약관. section으로 처음 펼칠 칸을 정합니다. */
export default function InfoPage({ section = 'faq' }) {
  const [key, setKey] = useState(section)
  const [openQ, setOpenQ] = useState(0) // 자주 묻는 질문에서 펼친 질문
  const current = INFO_SECTIONS.find((s) => s.key === key) ?? INFO_SECTIONS[0]

  return (
    <section className="info">
      <header className="info__head">
        <p className="info__eyebrow">안내</p>
        <h1>안심하고 쓰셔도 돼요</h1>
        <p className="info__lead">설치·가입 없이, 화면과 사진은 내 브라우저 안에서만 읽어요.</p>
      </header>

      {/* 한눈에 보는 약속 */}
      <ul className="info__promises">
        <li>
          <b>가입·로그인 없음</b>
          <span>게임 계정 정보를 묻지 않아요</span>
        </li>
        <li>
          <b>화면은 내 브라우저에서만</b>
          <span>공유 화면·사진을 서버로 보내지 않아요</span>
        </li>
        <li>
          <b>게임은 건드리지 않음</b>
          <span>게임 파일·메모리·키 입력에 손대지 않아요</span>
        </li>
        <li>
          <b>광고·유료 기능 없음</b>
          <span>
            코드는{' '}
            <a href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            에 공개돼 있어요
          </span>
        </li>
      </ul>

      <div className="info__body">
        <nav className="info__tabs" aria-label="안내 항목">
          {INFO_SECTIONS.map((s) => (
            <button key={s.key} type="button" className={`info__tab ${s.key === key ? 'info__tab--on' : ''}`} onClick={() => setKey(s.key)}>
              <b>{s.title}</b>
              <small>{s.summary}</small>
            </button>
          ))}
        </nav>

        <article className="info__doc">
          <h2>{current.title}</h2>
          {current.faq ? (
            <ul className="info__faq">
              {current.faq.map((item, i) => (
                <li key={item.q} className={openQ === i ? 'info__faq-item info__faq-item--open' : 'info__faq-item'}>
                  <button type="button" aria-expanded={openQ === i} onClick={() => setOpenQ(openQ === i ? null : i)}>
                    <span>Q.</span> {item.q}
                    <i aria-hidden="true">{openQ === i ? '−' : '+'}</i>
                  </button>
                  {openQ === i && (
                    <div className="info__faq-a">
                      {item.a.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="info__blocks">
              {current.blocks.map((b, i) =>
                b.h ? (
                  <h3 key={i}>{b.h}</h3>
                ) : b.list ? (
                  <ul key={i}>
                    {b.list.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  // 문장마다 줄을 바꿔서 읽기 쉽게("~니다." 뒤에서 끊음)
                  <p key={i}>
                    {b.p.split(/(?<=다\.)\s+/).map((line, j) => (
                      <span key={j} className="info__line">
                        {line}
                      </span>
                    ))}
                  </p>
                ),
              )}
              <p className="info__updated">시행일: {INFO_UPDATED}</p>
            </div>
          )}
          {CONTACT_URL && (
            <p className="info__contact">
              더 궁금한 점이 있나요?
              <a className="btn btn--primary" href={CONTACT_URL} target="_blank" rel="noreferrer">
                문의 남기기
              </a>
            </p>
          )}
        </article>
      </div>
    </section>
  )
}
