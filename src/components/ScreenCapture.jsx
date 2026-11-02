import { useEffect, useRef, useState } from 'react'
import './ScreenCapture.css'

// 화면 공유(getDisplayMedia)는 PC 브라우저에서만 됩니다. 모바일은 API가 없거나 마우스가 아닌 터치라 숨깁니다.
export const screenCaptureSupported =
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getDisplayMedia &&
  window.matchMedia?.('(pointer: fine)').matches

const GAME_RATIO = 16 / 9
const DARK = 16 // 이 밝기(0~255) 이하면 검은 여백으로 봅니다

/**
 * 공유 화면에서 게임 화면 영역을 찾습니다.
 * 1) 가장자리의 검은 여백(레터박스)을 걷어 내고
 * 2) 그래도 16:9보다 세로가 길면 창 제목 표시줄이 위에 붙은 것이라 아래쪽 16:9만 씁니다.
 * 16:9보다 가로가 긴 경우(울트라와이드 등)는 그대로 두면 이후 정규화(normalizeImage)가 오른쪽 기준으로 맞춥니다.
 */
function findGameArea(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height)
  const bright = (px, py) => {
    const i = (py * width + px) * 4
    return Math.max(data[i], data[i + 1], data[i + 2])
  }
  // 줄 전체를 다 보지 않고 32곳만 찍어 봐서, 모두 어두우면 여백 줄로 봅니다.
  const darkRow = (py) => {
    for (let k = 0; k < 32; k++) if (bright(Math.floor(((k + 0.5) * width) / 32), py) > DARK) return false
    return true
  }
  const darkCol = (px, top, bottom) => {
    for (let k = 0; k < 32; k++) if (bright(px, Math.floor(top + ((k + 0.5) * (bottom - top)) / 32)) > DARK) return false
    return true
  }

  let top = 0
  let bottom = height
  while (top < bottom - 1 && darkRow(top)) top++
  while (bottom - 1 > top && darkRow(bottom - 1)) bottom--
  let left = 0
  let right = width
  while (left < right - 1 && darkCol(left, top, bottom)) left++
  while (right - 1 > left && darkCol(right - 1, top, bottom)) right--

  // 거의 다 검은 화면(로딩 중 등)이면 자르지 않습니다.
  if (right - left < width / 4 || bottom - top < height / 4) return { x: 0, y: 0, w: width, h: height }

  let w = right - left
  let h = bottom - top
  if (w / h < GAME_RATIO - 0.01) {
    const gameH = Math.round(w / GAME_RATIO)
    top = bottom - gameH
    h = gameH
  }
  return { x: left, y: top, w, h }
}

/**
 * 게임 화면을 공유해 두고, 에코 화면을 띄울 때마다 "캡처" 버튼으로 지금 장면을 사진처럼 넘깁니다.
 * 스크린샷을 찍어 파일로 올리는 수고를 줄이기 위한 기능입니다. 공유 영상은 이 브라우저 안에서만 쓰이고 서버로 보내지 않습니다.
 *
 * onCapture(file): 캡처한 장면을 PNG File로 넘깁니다(파일 업로드와 같은 처리를 탑니다).
 * remaining: 더 올릴 수 있는 장 수. 0이면 캡처 버튼을 끕니다.
 */
export default function ScreenCapture({ onCapture, remaining }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [count, setCount] = useState(0)
  const [flash, setFlash] = useState(false)
  const [error, setError] = useState(null)

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setSharing(false)
  }

  useEffect(() => stop, [])

  const start = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 5 }, audio: false })
      streamRef.current = stream
      // 브라우저의 "공유 중지" 버튼으로 끊어도 화면을 정리합니다.
      stream.getVideoTracks()[0].addEventListener('ended', stop)
      setSharing(true)
    } catch (e) {
      if (e.name !== 'NotAllowedError') setError('화면 공유를 시작하지 못했어요.')
    }
  }

  // 공유가 시작되면 미리보기 영상에 연결합니다.
  useEffect(() => {
    if (sharing && videoRef.current) videoRef.current.srcObject = streamRef.current
  }, [sharing])

  const capture = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || remaining <= 0) return
    const frame = document.createElement('canvas')
    frame.width = video.videoWidth
    frame.height = video.videoHeight
    const frameCtx = frame.getContext('2d', { willReadFrequently: true })
    frameCtx.drawImage(video, 0, 0)

    // 스크린샷과 같은 모양이 되도록 게임 화면 부분만 잘라 냅니다.
    const { x, y, w, h } = findGameArea(frameCtx, frame.width, frame.height)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(frame, x, y, w, h, 0, 0, w, h)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    const n = count + 1
    setCount(n)
    setFlash(true)
    setTimeout(() => setFlash(false), 200)
    onCapture(new File([blob], `화면 캡처 ${n}.png`, { type: 'image/png' }))
  }

  if (!screenCaptureSupported) return null

  return (
    <div className="screen-capture">
      <div className={`screen-capture__preview ${flash ? 'screen-capture__preview--flash' : ''}`}>
        <video ref={videoRef} autoPlay muted playsInline hidden={!sharing} />
        {sharing ? (
          <span className="screen-capture__live">● 공유 중</span>
        ) : (
          <div className="screen-capture__idle" />
        )}
      </div>
      {sharing ? (
        <div className="screen-capture__actions">
          <button
            type="button"
            className="btn btn--primary screen-capture__shot"
            onClick={capture}
            disabled={remaining <= 0}
          >
            {remaining > 0 ? `캡처 · ${remaining}장 남음` : '캡처를 완료했어요.'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={stop}>
            공유 중지
          </button>
        </div>
      ) : (
        <>
        <button type="button" className="btn btn--primary screen-capture__start" onClick={start}>
          화면 공유로 바로 캡처 (PC 전용)
        </button>
        <ul className="uploader__hint screen-capture__notes">
          <li>모니터 전체가 아니라 게임 창을 선택해 주세요. 다른 창이 함께 잡히면 인식되지 않을 수 있습니다.</li>
          <li>16:9 화면에 맞춰져 있어요. 16:10 등 다른 비율에서는 화면이 깨지거나 스탯 위치가 어긋날 수 있습니다.</li>
          <li>창 크기가 작거나 해상도가 낮으면 글자가 뭉개져 인식되지 않을 수 있습니다.</li>
        </ul>
        </>
      )}
      {error && <p className="screen-capture__error">{error}</p>}
    </div>
  )
}
