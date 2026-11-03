import { useEffect, useState } from 'react'
import { assetPath } from '../config/assetPath'
import { fetchBroadcasts } from '../utils/api'

/** 관리자 페이지에서 종료 일시를 정해 등록한 방송 소식입니다. 지금 걸린 방송이 없으면 없다고 안내합니다. */
export default function BroadcastNews() {
  const [broadcasts, setBroadcasts] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchBroadcasts()
      .then((result) => !cancelled && setBroadcasts(result.filter((b) => b.imagePath)))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="home-page__panel">
      <h4 className="home-page__panel-title">방송 소식</h4>
      {broadcasts.length === 0 && <p className="home-page__broadcast-empty">현재 예정된 방송이 없습니다.</p>}
      {broadcasts.map((b) => {
        const image = <img className="home-page__broadcast" src={assetPath(b.imagePath)} alt={b.title} />
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
