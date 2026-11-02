import { useRef, useState } from 'react'
import { normalizeImage, cropNormalizedImage, blobToDataURL, MAX_IMAGES, TARGET_WIDTH, TARGET_HEIGHT } from '../utils/image'
import { FIXED_REGIONS, REGION_META, SCAN_PREVIEW_REGION } from '../config/regions'
import Modal from './Modal'
import ScreenCapture, { screenCaptureSupported } from './ScreenCapture'
import './ImageUploader.css'

export default function ImageUploader({ onExtractAll, isProcessing, progress }) {
  const [items, setItems] = useState([]) // { id, name, dataUrl, error }
  // 'upload' = 스크린샷 올리기, 'share' = PC 화면 공유. 화면 공유를 못 쓰는 환경(모바일 등)은 고르는 단계 없이 바로 올리기로 갑니다.
  const [mode, setMode] = useState(screenCaptureSupported ? null : 'upload')
  // 화면 캡처를 연달아 누르면 앞 사진 처리가 끝나기 전에 다음 addFiles가 시작돼서, 최신 목록을 ref로 들고 있습니다.
  const itemsRef = useRef(items)
  itemsRef.current = items
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

  // extract=false면 목록에만 쌓아 둡니다(화면 공유는 여러 장 찍은 뒤 "검토하기"로 한 번에 넘깁니다).
  const addFiles = async (fileList, { extract = true } = {}) => {
    const files = Array.from(fileList).slice(0, MAX_IMAGES - itemsRef.current.length)
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

    const merged = [...itemsRef.current, ...newItems].slice(0, MAX_IMAGES)
    itemsRef.current = merged
    setItems(merged)

    const failed = newItems.filter((it) => it.error)
    if (failed.length > 0) {
      setErrorNotice(failed.map((it) => ({ name: it.name, error: it.error })))
    }

    // 사진이 올라오면 바로 자동으로 추출을 실행합니다 (별도 버튼 클릭 불필요).
    const validNow = merged.filter((it) => !it.error)
    if (extract && validNow.length > 0) {
      await runExtraction(validNow)
    }
  }

  const removeItem = (id) => {
    const next = itemsRef.current.filter((it) => it.id !== id)
    itemsRef.current = next
    setItems(next)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  return (
    <section className="uploader">
      <header className="uploader__head">
        <div className="uploader__title-row">
          <h2>업로드 방식을 선택해주세요.</h2>
          {mode !== null && screenCaptureSupported && (
            <button type="button" className="btn btn--ghost uploader__mode-back" onClick={() => setMode(null)}>
              ← 뒤로
            </button>
          )}
        </div>
        <p className="uploader__hint">
          최대 {MAX_IMAGES}장까지 업로드가 가능합니다.
        </p>
      </header>

      {mode === null && (
        <div className="uploader__modes">
          <button type="button" className="uploader__mode" onClick={() => setMode('upload')}>
            <strong>스크린샷</strong> 
            <span>저장한 사진으로 업로드 할게요.</span>
          </button>
          <button type="button" className="uploader__mode" onClick={() => setMode('share')}>
            <strong>PC 공유</strong>
            <span>화면 공유로 실시간 업로드 할게요.</span>
          </button>
        </div>
      )}

      {mode === 'share' && (
        <>
          <ScreenCapture
            onCapture={(file) => addFiles([file], { extract: false })}
            remaining={MAX_IMAGES - items.length}
          />
          {items.some((it) => !it.error) && (
            <button
              type="button"
              className="btn btn--primary uploader__review"
              disabled={isProcessing}
              onClick={() => runExtraction(items.filter((it) => !it.error))}
            >
              {items.filter((it) => !it.error).length}장 검토하기
            </button>
          )}
        </>
      )}

      {mode === 'upload' && items.length < MAX_IMAGES && (
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
