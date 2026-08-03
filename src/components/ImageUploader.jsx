import { useState } from 'react'
import { normalizeImage, cropNormalizedImage, blobToDataURL, MAX_IMAGES, TARGET_WIDTH, TARGET_HEIGHT } from '../utils/image'
import { FIXED_REGIONS, REGION_META, SCAN_PREVIEW_REGION } from '../config/regions'
import Modal from './Modal'
import './ImageUploader.css'

export default function ImageUploader({ onExtractAll, isProcessing, progress }) {
  const [items, setItems] = useState([]) // { id, name, dataUrl, error }
  // 방금 올린 사진 중 인식 불가·해상도 부족으로 실패한 것들을 안내창으로 띄워줍니다
  // (썸네일 아래 작은 빨간 글씨만으로는 놓치기 쉬워서).
  const [errorNotice, setErrorNotice] = useState(null) // [{ name, error }] | null

  const runExtraction = async (validItems) => {
    if (validItems.length === 0) return

    const perImage = await Promise.all(
      validItems.map(async (it) => {
        const crops = {}
        for (const meta of REGION_META) {
          crops[meta.key] = await cropNormalizedImage(it.dataUrl, FIXED_REGIONS[meta.key])
        }
        const previewBlob = await cropNormalizedImage(it.dataUrl, SCAN_PREVIEW_REGION)
        const previewUrl = await blobToDataURL(previewBlob)
        return { id: it.id, name: it.name, crops, previewUrl }
      }),
    )

    onExtractAll(perImage)
  }

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

    const merged = [...items, ...newItems].slice(0, MAX_IMAGES)
    setItems(merged)

    const failed = newItems.filter((it) => it.error)
    if (failed.length > 0) {
      setErrorNotice(failed.map((it) => ({ name: it.name, error: it.error })))
    }

    // 사진이 올라오면 바로 자동으로 추출을 실행합니다 (별도 버튼 클릭 불필요).
    const validNow = merged.filter((it) => !it.error)
    if (validNow.length > 0) {
      await runExtraction(validNow)
    }
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  return (
    <section className="uploader">
      <header className="uploader__head">
        <h2>메아리 스크린샷을 올리세요</h2>
        <p className="uploader__hint">
          최대 {MAX_IMAGES}장까지 올릴 수 있어요. 올리는 즉시 자동으로 {TARGET_WIDTH}×{TARGET_HEIGHT}로
          맞춰지고, 메인·서브 스탯 영역이 자동으로 인식됩니다. 영역을 직접 지정하거나 버튼을 따로 누를
          필요는 없습니다.
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

      <Modal open={!!errorNotice} title="사진을 인식하지 못했어요" onClose={() => setErrorNotice(null)}>
        {errorNotice?.map((f, i) => (
          <p key={i} className="uploader__notice-item">
            <strong>{f.name}</strong>: {f.error}
          </p>
        ))}
      </Modal>
    </section>
  )
}
