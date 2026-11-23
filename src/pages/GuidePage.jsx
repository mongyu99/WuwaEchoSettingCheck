import { useEffect, useState } from 'react'
import { assetPath } from '../config/assetPath'
import './GuidePage.css'

// 가이드: 사이트가 답해 주는 질문 세 가지를, 실제 화면 캡쳐로 한 단계씩 따라가게 보여 줍니다.
// 그림은 public/guide/ 에 있습니다(실제 사이트를 캡쳐한 것). spots: 그림에서 눌러야 할 곳(그림 대비 %)
const FLOWS = [
  {
    id: 'build',
    question: '내 에코, 운 좋게 먹은 걸까?',
    menu: '캐릭터 빌드 체크',
    steps: [
      { image: 'q1-characters.webp', title: '캐릭터 고르기', body: '상단 [캐릭터 빌드 체크]에서 확인할 캐릭터를 골라요. 세팅을 저장한 캐릭터는 카드에 등급과 점수가 보여요.', spots: [{ x: 8.6, y: 1.1, w: 6.2, h: 3, label: '메뉴' }, { x: 38.7, y: 27.2, w: 10.8, h: 28.1, label: '캐릭터 카드' }] },
      { image: 'q1-upload-modes.webp', title: '업로드 방식 고르기', body: '스크린샷, PC 화면 공유, 자동 캡처 중 편한 방식을 골라요.', spots: [{ x: 20.9, y: 34.2, w: 23.9, h: 21.9, label: '스크린샷' }] },
      { image: 'q1-upload-drop.webp', title: '스크린샷 올리기', body: '게임의 캐릭터 → 에코 → 교체 화면을 전체 화면으로 찍어서 올려요. 에코 한 개당 한 장, 최대 5장이에요.', spots: [{ x: 20.9, y: 34.2, w: 73.4, h: 21.9, label: '눌러서 사진 선택' }] },
      { image: 'q1-edit.webp', title: '인식 결과 확인', body: '왼쪽은 올린 사진, 오른쪽은 읽은 옵션이에요. 잘못 읽은 곳이 있으면 여기서 고쳐요.', spots: [{ x: 25.6, y: 48.6, w: 69, h: 24, label: '옵션 · 수치 고치기' }] },
      { image: 'q1-stats.webp', title: '점수와 스탯 보기', body: '무기·세트·메인 에코까지 합친 최종 스탯을 보여 줘요. 캐릭터에게 유효한 옵션은 노란색으로 표시돼요.', spots: [{ x: 16, y: 51.7, w: 8.7, h: 20.1, label: '유효 옵션' }, { x: 41, y: 21.3, w: 26.3, h: 41.7, label: '최종 스탯' }] },
      { image: 'q1-echo-detail.webp', title: '에코별 점수', body: '아래 [에코 상세 설정]에서 에코마다 점수와 등급을 봐요. 옵션을 직접 고치거나 [재촬영]으로 다시 찍을 수도 있어요.', spots: [{ x: 31.2, y: 59.8, w: 18.1, h: 17.4, label: '서브 옵션' }, { x: 53.3, y: 43.6, w: 14, h: 30.6, label: '점수 · 등급' }, { x: 47, y: 43.2, w: 3.9, h: 3.4, label: '재촬영' }] },
    ],
  },
  {
    id: 'goal',
    question: '더 올리려면 어디를 어떻게 바꾸는 게 빨라?',
    menu: '목표 스탯 계산기',
    steps: [
      { image: 'q2-goal-input.webp', title: '목표 입력', body: '빌드 체크 화면 오른쪽 [목표 스탯 계산기]에 원하는 수치를 넣고 [계산하기]를 눌러요. 0을 넣으면 그 옵션은 포기한 걸로 봐요.', spots: [{ x: 70.1, y: 35.7, w: 13.8, h: 13.2, label: '목표 수치' }, { x: 70.1, y: 60.7, w: 13.8, h: 3.4, label: '계산하기' }] },
      { image: 'q2-goal-result.webp', title: '가장 빠른 계획', body: '모든 목표를 한 번에 채우는 교체 계획이에요. 에코마다 빼는 옵션 → 붙어야 할 옵션, 지켜야 할 옵션, 뜰 확률을 보여 줘요.', spots: [{ x: 36.1, y: 23.9, w: 41.6, h: 11.1, label: '에코별 교체' }, { x: 16.1, y: 61.1, w: 18, h: 3.5, label: '강화하러 가기' }] },
      { image: 'q2-mission.webp', title: '강화 목표로 가져가기', body: '[이 계획으로 강화하러 가기]를 누르면 에코 체크에 강화 목표가 붙어요. 지금 끼고 있는 에코 대신 어떤 옵션이 붙은 에코를 띄워야 하는지 보여 줘요.', spots: [{ x: 43.4, y: 24.4, w: 40.5, h: 43.6, label: '강화 목표' }] },
      { image: 'q2-mission.webp', title: '강화하면서 바로 확인', body: '새 에코를 띄우면 목표 조건을 채웠는지 ✓ / ✕ 로 바로 알려 줘요. 조건 미달이면 다음 에코로 넘어가면 돼요.', spots: [{ x: 16.1, y: 27.6, w: 24.6, h: 24.6, label: '띄운 에코' }, { x: 44.4, y: 32.3, w: 38.6, h: 12.6, label: '✓ / ✕ 확인' }] },
    ],
  },
  {
    id: 'fit',
    question: '이 에코, 누가 쓰면 좋을까?',
    menu: '에코 체크 · 에코 가방 · 추천 세팅',
    steps: [
      { image: 'q3-live-compare.webp', title: '에코 띄우기', body: '[에코 체크]에서 실시간(화면 공유) 또는 캡쳐로 에코를 읽어요. 옵션마다 최저~최고 수치와 몇 단계인지 보여 줘요.', spots: [{ x: 38.1, y: 24.3, w: 2.8, h: 2.5, label: '캡쳐 탭' }, { x: 16.1, y: 66.3, w: 24.6, h: 21.8, label: '인식한 에코' }] },
      { image: 'q3-live-compare.webp', title: '바꾸면 얼마나 달라질까', body: '캐릭터를 고르면, 지금 끼고 있는 에코 대신 이 에코를 넣었을 때 점수와 실제 스탯이 얼마나 바뀌는지 보여 줘요. ↑ 는 더 좋은 에코가 뜰 확률이에요.', spots: [{ x: 43.4, y: 24.4, w: 40.5, h: 3.5, label: '캐릭터' }, { x: 43.4, y: 32.7, w: 40.5, h: 5.5, label: '바꿀 자리' }, { x: 43.4, y: 43.6, w: 40.5, h: 26, label: '스탯 변화' }] },
      { image: 'q3-bag.webp', title: '가방 통째로 저장', body: '[에코 가방]에서 화면을 공유하고 게임 가방을 넘기면, 보이는 에코를 한꺼번에 저장해요.', spots: [{ x: 16.1, y: 31.3, w: 21.2, h: 3.6, label: '화면 공유 시작' }, { x: 39.9, y: 16, w: 44.1, h: 74, label: '저장된 에코' }] },
      { image: 'q3-bag-fit.webp', title: '캐릭터에 맞는 순서', body: '캐릭터를 고르면 그 캐릭터에게 맞는 에코 순으로 정렬하고, 코스트별 1위를 표시해 줘요.', spots: [{ x: 57.1, y: 27.8, w: 7.4, h: 3.5, label: '캐릭터 맞춤' }, { x: 80.4, y: 34.8, w: 3.2, h: 7.6, label: '코스트별 1위' }] },
      { image: 'q3-recommend.webp', title: '추천 세팅', body: '[추천 세팅]에서 가방 에코로 메인 에코와 추천 세트를 맞춘 5개 조합을 만들어요. 4-3-3-1-1 / 4-4-1-1-1 중 고를 수 있어요.', spots: [{ x: 15.2, y: 22.8, w: 7.4, h: 3.5, label: '캐릭터' }, { x: 23.6, y: 22.8, w: 9.1, h: 3.5, label: '코스트 배치' }, { x: 81.6, y: 27.8, w: 3.3, h: 3.6, label: '교체' }] },
      { image: 'q3-replace.webp', title: '골라서 교체', body: '[교체]를 누르면 기존 → 변경을 나란히 보여 줘요. 바꿀 자리만 체크하면 오른쪽에서 실제 스탯이 어떻게 바뀌는지 바로 계산돼요.', spots: [{ x: 20.3, y: 42.4, w: 1.9, h: 29.6, label: '바꿀 자리' }, { x: 63.6, y: 30.9, w: 16.6, h: 30, label: '실제 스탯' }, { x: 58.1, y: 75.8, w: 4.6, h: 3.6, label: '교체' }] },
    ],
  },
]

/** 화면 캡쳐 + 눌러야 할 곳(번호 + 이름이 붙은 깜빡이는 테두리) */
function Shot({ s }) {
  return (
    <>
      <img key={s.image} src={assetPath(`guide/${s.image}`)} alt={s.title} width="1200" height="675" decoding="async" />
      {(s.spots ?? []).map((sp, i) => (
        <span
          key={`${s.image}-${i}`}
          className="guide__spot"
          style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: `${sp.w}%`, height: `${sp.h}%` }}
        >
          <em className={sp.y + sp.h > 88 ? 'guide__spot-label guide__spot-label--up' : 'guide__spot-label'}>
            {i + 1}. {sp.label}
          </em>
        </span>
      ))}
    </>
  )
}

export default function GuidePage() {
  const [zoom, setZoom] = useState(false) // 휴대폰: 그림 크게 보기
  // 다음 단계 그림이 눌렀을 때 바로 뜨게, 페이지를 열면 전부 미리 받아 둡니다(장당 20~50KB).
  useEffect(() => {
    new Set(FLOWS.flatMap((f) => f.steps.map((st) => st.image))).forEach((name) => {
      const img = new Image()
      img.src = assetPath(`guide/${name}`)
    })
  }, [])
  const [flowId, setFlowId] = useState(FLOWS[0].id)
  const [step, setStep] = useState(0)
  const flow = FLOWS.find((f) => f.id === flowId)
  const s = flow.steps[step]
  const pickFlow = (id) => {
    setFlowId(id)
    setStep(0)
  }

  return (
    <section className="guide">
      <header className="guide__head">
        <p className="guide__eyebrow">가이드</p>
        <h1>이런 게 궁금할 때 써요</h1>
      </header>

      <div className="guide__flows" role="tablist" aria-label="궁금한 것">
        {FLOWS.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={f.id === flowId}
            className={`guide__flow ${f.id === flowId ? 'guide__flow--on' : ''}`}
            onClick={() => pickFlow(f.id)}
          >
            <small>Q{i + 1}</small>
            <b>{f.question}</b>
            <span>{f.menu}</span>
          </button>
        ))}
      </div>

      <div className="guide__body">
        {/* 왼쪽: 단계 목록(눌러서 바로 이동) + 지금 단계 설명 + 이전/다음 */}
        <aside className="guide__side">
        <ol className="guide__steps">
          {flow.steps.map((st, i) => (
            <li key={st.title}>
              <button
                type="button"
                className={`guide__step ${i === step ? 'guide__step--on' : ''}`}
                onClick={() => setStep(i)}
                // 휴대폰(가로로 넘기는 단계 목록): 지금 단계가 보이게 목록만 옆으로 밀어 줍니다(페이지는 안 움직임).
                ref={(el) => {
                  if (el && i === step && el.parentElement?.parentElement) {
                    const list = el.parentElement.parentElement
                    if (list.scrollWidth > list.clientWidth) {
                      const left = list.scrollLeft + el.getBoundingClientRect().left - list.getBoundingClientRect().left - 16
                      list.scrollTo({ left, behavior: 'smooth' })
                    }
                  }
                }}
              >
                <span className="guide__step-num">{i + 1}</span>
                {st.title}
              </button>
            </li>
          ))}
        </ol>
          <div className="guide__caption">
            <p className="guide__count">
              {step + 1} / {flow.steps.length}
            </p>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <div className="guide__nav">
              <button type="button" className="btn btn--ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
                ← 이전
              </button>
              {step < flow.steps.length - 1 ? (
                <button type="button" className="btn btn--primary" onClick={() => setStep(step + 1)}>
                  다음 →
                </button>
              ) : (
                (() => {
                  const next = FLOWS[FLOWS.indexOf(flow) + 1]
                  return next ? (
                    <button type="button" className="btn btn--primary guide__next-q" onClick={() => pickFlow(next.id)}>
                      <small>다음 질문 →</small>
                      <span>{next.question}</span>
                    </button>
                  ) : (
                    // 마지막 질문 끝: 버튼 자리를 비워 두면 [이전] 위치가 흔들려서 같은 크기로 둡니다.
                    <button type="button" className="btn btn--primary" onClick={() => pickFlow(FLOWS[0].id)}>
                      처음으로
                    </button>
                  )
                })()
              )}
            </div>
          </div>
        </aside>

        {/* 오른쪽: 실제 화면 캡쳐. 휴대폰에선 그림이 작아서 눌러 크게 볼 수 있게 합니다. */}
        <figure className="guide__view">
          <Shot s={s} />
          <button type="button" className="guide__zoom-btn" onClick={() => setZoom(true)}>
            크게 보기
          </button>
        </figure>
        {zoom && (
          <div className="guide__zoom" role="dialog" aria-label={s.title} onClick={() => setZoom(false)}>
            <p className="guide__zoom-hint">옆으로 밀어서 보세요 · 아무 곳이나 누르면 닫혀요</p>
            <div className="guide__zoom-scroll">
              <figure className="guide__view guide__view--zoom">
                <Shot s={s} />
              </figure>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
