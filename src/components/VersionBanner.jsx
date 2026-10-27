import { useEffect, useState } from 'react'
import { fetchBanners } from '../utils/api'
import { assetPath } from '../config/assetPath'
import { FALLBACK_BANNERS } from '../config/versionBanner'
import VersionTimer from './VersionTimer'
import './VersionBanner.css'

const SLIDE_INTERVAL_MS = 5000

function useAutoSlide(count) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (count <= 1) return undefined
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [count])

  return [index, setIndex]
}

/**
 * 관리자 페이지에서 기간을 정해 등록한 배너 중 지금 노출 중인 것만 받아 슬라이드하고,
 * 바로 아래 타이머에 지금 보이는 배너의 기간을 넘깁니다.
 */
export default function VersionBanner() {
  const [banners, setBanners] = useState([])
  const [index, setIndex] = useAutoSlide(banners.length)

  useEffect(() => {
    let cancelled = false
    fetchBanners()
      .then((result) => !cancelled && setBanners(result.filter((b) => b.imagePath)))
      // 서버나 DB 조회가 실패하면 public/main/의 로컬 배너를 대신 보여줍니다.
      .catch(() => !cancelled && setBanners(FALLBACK_BANNERS))
    return () => {
      cancelled = true
    }
  }, [])

  const current = banners[index]

  return (
    <>
      <div className="version-banner">
        <div className="version-banner__image-wrap">
          {banners.length > 0 ? (
            <div className="version-banner__track" style={{ transform: `translateX(-${index * 100}%)` }}>
              {banners.map((banner) => (
                <img
                  key={banner.id}
                  className="version-banner__image"
                  src={assetPath(banner.imagePath)}
                  alt={banner.title}
                />
              ))}
            </div>
          ) : (
            <div className="version-banner__image version-banner__image--empty" />
          )}

          {banners.length > 1 && (
            <div className="version-banner__dots">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  className={`version-banner__dot ${i === index ? 'version-banner__dot--active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1}번째 배너`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {current && <VersionTimer startsAt={current.startsAt} endsAt={current.endsAt} />}
    </>
  )
}
