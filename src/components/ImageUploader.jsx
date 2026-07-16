import { useState } from 'react'
import { normalizeImage, cropNormalizedImage, MAX_IMAGES, TARGET_WIDTH, TARGET_HEIGHT } from '../utils/image'
import { FIXED_REGIONS, REGION_META, SCAN_PREVIEW_REGION } from '../config/regions'
import './ImageUploader.css'

const toPercentBox = (rect) => ({
  left: `${(rect.x / TARGET_WIDTH) * 100}%`,
  top: `${(rect.y / TARGET_HEIGHT) * 100}%`,
  width: `${(rect.width / TARGET_WIDTH) * 100}%`,
  height: `${(rect.height / TARGET_HEIGHT) * 100}%`,
})

export default function ImageUploader({ onExtractAll, isProcessing, progress, compact }) {
  const [items, setItems] = useState([]) // { id, name, dataUrl, error }

  const validItems = items.filter((it) => !it.error)
  const reference = validItems[0] ?? null

  const addFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_IMAGES - items.length)
    if (files.length === 0) return

    const newItems = await Promise.all(
      files.map(async (file) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        try {
          const { dataUrl } = await normalizeImage(file)
          return { id, name: file.name, dataUrl, error: null }
        } catch (err) {
          return { id, name: file.name, dataUrl: null, error: err.message }
        }
      }),
    )

    setItems((prev) => [...prev, ...newItems].slice(0, MAX_IMAGES))
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const handleExtractAll = async () => {
    if (validItems.length === 0) return

    const perImage = await Promise.all(
      validItems.map(async (it) => {
        const crops = {}
        for (const meta of REGION_META) {
          crops[meta.key] = await cropNormalizedImage(it.dataUrl, FIXED_REGIONS[meta.key])
        }
        const previewBlob = await cropNormalizedImage(it.dataUrl, SCAN_PREVIEW_REGION)
        const previewUrl = URL.createObjectURL(previewBlob)
        return { id: it.id, name: it.name, crops, previewUrl }
      }),
    )

    onExtractAll(perImage)
  }

  if (compact) {
    return (
      <section className="uploader uploader--compact">
        <span className="uploader__compact-info">
          업로드 {items.length}장 ({validItems.length}장 유효)
        </span>
        <div className="uploader__actions uploader__actions--compact">
          {items.length < MAX_IMAGES && (
            <label className="uploader__add-btn" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
                hidden
              />
              + 사진 추가
            </label>
          )}
          <button className="btn btn--primary" onClick={handleExtractAll} disabled={isProcessing}>
            {isProcessing ? `인식 중 ${Math.round((progress ?? 0) * 100)}%` : '다시 추출'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="uploader">
      <header className="uploader__head">
        <span className="uploader__eyebrow">01 — 스캔</span>
        <h2>메아리 스크린샷을 올리세요</h2>
        <p className="uploader__hint">
          최대 {MAX_IMAGES}장까지 올릴 수 있어요. 사진은 자동으로 {TARGET_WIDTH}×{TARGET_HEIGHT}로 맞춰지고,
          이름·메인 스탯·서브 스탯 영역은 항상 같은 위치라고 보고 자동으로 잘라서 인식합니다. 영역을 직접
          지정할 필요는 없습니다.
        </p>
      </header>

      {items.length < MAX_IMAGES && (
        <label className="uploader__drop" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
            hidden
          />
          <span>이미지 선택 또는 드래그해서 놓기 ({items.length}/{MAX_IMAGES})</span>
        </label>
      )}

      {items.length > 0 && (
        <ul className="uploader__list">
          {items.map((it) => (
            <li key={it.id} className={`uploader__item ${it.error ? 'uploader__item--error' : ''}`}>
              {it.dataUrl && <img src={it.dataUrl} alt={it.name} />}
              <div className="uploader__item-info">
                <span className="uploader__item-name">{it.name}</span>
                {it.error && <span className="uploader__item-error">{it.error}</span>}
              </div>
              <button className="uploader__item-remove" onClick={() => removeItem(it.id)} aria-label="사진 제거">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {reference && (
        <div className="uploader__stage">
          <p className="uploader__hint uploader__hint--tight">
            자동으로 지정된 영역이 실제 스탯 위치와 맞는지 확인해보세요. 어긋나 있다면 알려주세요 — 좌표를
            다시 맞춰드릴게요.
          </p>

          <div className="uploader__preview">
            <img src={reference.dataUrl} alt="기준 스크린샷 미리보기" />
            {REGION_META.map((meta) => (
              <div
                key={meta.key}
                className="region-overlay"
                style={{ ...toPercentBox(FIXED_REGIONS[meta.key]), borderColor: `var(${meta.varName})` }}
                title={meta.label}
              />
            ))}
          </div>

          <div className="region-legend">
            {REGION_META.map((meta) => (
              <span key={meta.key} className="region-legend__item">
                <span className="region-legend__dot" style={{ background: `var(${meta.varName})` }} />
                {meta.label}
              </span>
            ))}
          </div>

          <div className="uploader__actions">
            <button className="btn btn--primary" onClick={handleExtractAll} disabled={isProcessing}>
              {isProcessing
                ? `인식 중 ${Math.round((progress ?? 0) * 100)}%`
                : `${validItems.length}장에서 자동 추출`}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
