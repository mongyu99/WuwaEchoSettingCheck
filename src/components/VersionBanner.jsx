import { useEffect, useState } from 'react'
import { VERSION_BANNER } from '../config/versionBanner'
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

export default function VersionBanner() {
  const { version, images } = VERSION_BANNER
  const [index, setIndex] = useAutoSlide(images.length)

  return (
    <div className="version-banner">
      <div className="version-banner__image-wrap">
        {images.length > 0 ? (
          <div className="version-banner__track" style={{ transform: `translateX(-${index * 100}%)` }}>
            {images.map((src, i) => (
              <img key={src} className="version-banner__image" src={src} alt={`${version} 버전 배너 ${i + 1}`} />
            ))}
          </div>
        ) : (
          <div className="version-banner__image version-banner__image--empty" />
        )}

        {images.length > 1 && (
          <div className="version-banner__dots">
            {images.map((src, i) => (
              <button
                key={src}
                className={`version-banner__dot ${i === index ? 'version-banner__dot--active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}번째 배너`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
