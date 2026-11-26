import { useEffect, useState } from 'react'
import { assetPath } from '../config/assetPath'
import { fetchBroadcasts } from '../utils/api'

/** 관리자 페이지에서 종료 일시를 정해 등록한 방송 소식입니다. 지금 걸린 방송이 없으면 없다고 안내합니다. */
export default function BroadcastNews() {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true) // 불러오기 전엔 "없습니다" 대신 불러오는 중으로 보여줍니다

  useEffect(() => {
    let cancelled = false
    fetchBroadcasts()
      .then((result) => !cancelled && setBroadcasts(result.filter((b) => b.imagePath)))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="home-page__panel">
      <h4 className="home-page__panel-title">방송 소식</h4>
      {/* 불러오는 동안 이미지 크기(16:9) 자리를 잡아 둬서 아래가 밀리지 않게 합니다. */}
      {loading && <div className="home-page__broadcast home-page__broadcast--loading" aria-label="방송 소식 불러오는 중" />}
      {!loading && broadcasts.length === 0 && <p className="home-page__broadcast-empty">현재 예정된 방송이 없습니다.</p>}
      {broadcasts.map((b) => {
        const image = <img className="home-page__broadcast" src={assetPath(b.imagePath)} alt={b.title} width="1600" height="900" decoding="async" />
        return b.url ? (
          <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer">
            {image}
          </a>
        ) : (
          <div key={b.id}>{image}</div>
        )
      })}
    </section>
  )
}
