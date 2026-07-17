import './HomePage.css'

export default function HomePage({ onStart }) {
  return (
    <section className="home-page">
      <h2>메아리 세팅, 숫자로 증명하세요</h2>
      <p>캐릭터를 고르고, 메아리 스크린샷을 올려서 서브 스탯을 확인·수정하고 점수까지 매겨보세요.</p>
      <button className="btn btn--primary" onClick={onStart}>
        에코 세팅 시작
      </button>
    </section>
  )
}
