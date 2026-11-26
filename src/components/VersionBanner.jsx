import { useEffect, useState } from 'react'
import { fetchBanners } from '../utils/api'
import { assetPath } from '../config/assetPath'
import { FALLBACK_BANNERS } from '../config/versionBanner'
import './VersionBanner.css'

const SLIDE_INTERVAL_MS = 5000
// 마지막으로 받은 배너 목록. 다음 방문 때 서버 응답을 기다리지 않고 바로 첫 배너를 그립니다(LCP).
// index.html의 미리 불러오기 스크립트도 이 키의 firstUrl을 읽으므로 이름을 바꾸면 같이 바꿔야 합니다.
const CACHE_KEY = 'wuwa-echo-check:banners'
const FIRST_IMAGE_URL = '/api/banners/first-image'

function loadCachedBanners() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY))?.banners ?? []
  } catch {
    return []
  }
}

function saveCachedBanners(banners) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ banners, firstUrl: banners[0] ? assetPath(banners[0].imagePath) : null }))
  } catch {
    // 저장 못 해도 다음에 서버에서 받으면 됩니다.
  }
}

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
// 지금 보이는 배너를 onCurrentChange로 알려 줍니다(홈 오른쪽 타이머가 그 배너의 기간을 씁니다).
export default function VersionBanner({ onCurrentChange }) {
  const [banners, setBanners] = useState(loadCachedBanners)
  // 처음 온 사람(저장된 목록 없음): 목록 API를 기다리지 않고, 서버가 첫 배너로 보내 주는 주소로 바로 그립니다.
  // index.html이 같은 주소를 미리 받아 두므로 곧바로 뜨고, 목록이 와도 첫 칸은 같은 <img>를 그대로 써서 다시 그리지 않습니다(LCP).
  const [firstSrc, setFirstSrc] = useState(() => (loadCachedBanners().length ? null : FIRST_IMAGE_URL))
  const [index, setIndex] = useAutoSlide(banners.length)

  useEffect(() => {
    let cancelled = false
    fetchBanners()
      .then((result) => {
        if (cancelled) return
        const shown = result.filter((b) => b.imagePath)
        if (shown.length === 0) setFirstSrc(null) // 보여 줄 배너가 없으면 미리 그린 첫 칸도 치웁니다
        setBanners(shown)
        saveCachedBanners(shown)
      })
      // 서버나 DB 조회가 실패하면 public/main/의 로컬 배너를 대신 보여줍니다.
      .catch(() => {
        if (cancelled) return
        setFirstSrc(null)
        setBanners(FALLBACK_BANNERS)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const current = banners[index]

  useEffect(() => {
    onCurrentChange?.(current ?? null)
  }, [current, onCurrentChange])

  return (
    <>
      <div className="version-banner">
        <div className="version-banner__image-wrap">
          {banners.length > 0 || firstSrc ? (
            <div className="version-banner__track" style={{ transform: `translateX(-${index * 100}%)` }}>
              {(banners.length > 0 ? banners : [{ id: 'first', title: '메인 배너', imagePath: null }]).map((banner, i) => (
                <img
                  // 첫 칸은 key를 고정해, 목록이 도착해도 같은 그림을 다시 만들지 않습니다.
                  key={i === 0 ? 'first' : banner.id}
                  className="version-banner__image"
                  src={i === 0 && firstSrc ? firstSrc : assetPath(banner.imagePath)}
                  alt={banner.title}
                  // 첫 배너가 화면에서 가장 큰 그림(LCP)이라 가장 먼저 받고, 나머지는 넘어갈 때 받습니다.
                  fetchpriority={i === 0 ? 'high' : 'low'}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding={i === 0 ? 'sync' : 'async'}
                  width={1920}
                  height={1080}
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
    </>
  )
}
