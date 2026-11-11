// 에코 가방 정리 개발자 도구: 게임 화면 위에 "어디를 읽는지"를 색 박스로 그려 보여 줍니다.
import { BAG_REGIONS } from '../config/regions'
import { BAG_WATCH_REGIONS } from './screenWatch'

// 좌표는 모두 1920x1080 기준(오른쪽 끝 맞춤)입니다. echoRecognition.js·setIconMatch.js와 같은 값입니다.
export const BAG_DEBUG_BOXES = [
  ...BAG_WATCH_REGIONS.map((r) => ({ ...r, label: '변화 감지', color: '#facc15', dash: true })),
  { ...BAG_REGIONS.name, label: '이름', color: '#22d3ee' },
  { ...BAG_REGIONS.mainStat, label: '메인 옵션', color: '#a78bfa' },
  { ...BAG_REGIONS.subStat, label: '서브 옵션', color: '#34d399' },
  { x: 1401, y: 199, width: 28, height: 28, label: '세트 아이콘', color: '#f472b6' },
  { x: 1615, y: 170, width: 245, height: 245, label: '썸네일', color: '#fb923c' },
].filter((b, i, list) => list.findIndex((x) => x.label === b.label) === i || b.dash)

const SHOT_WIDTH = 640

/** 게임 화면을 줄여 박스를 그린 dataURL을 돌려줍니다. 오른쪽 상세 패널 쪽만 크게 보여 줍니다. */
export function drawDebugSnapshot(area) {
  const scale = area.height / 1080
  // 1920 기준 x 1250~1920(상세 패널)만 잘라 크게 봅니다.
  const cropX = area.width - (1920 - 1250) * scale
  const cropW = 670 * scale
  const out = document.createElement('canvas')
  out.width = SHOT_WIDTH
  out.height = Math.round((SHOT_WIDTH / 670) * 1080 * 0.75)
  const k = SHOT_WIDTH / 670
  const ctx = out.getContext('2d')
  ctx.drawImage(area, cropX, 0, cropW, 1080 * 0.75 * scale, 0, 0, out.width, out.height)
  for (const b of BAG_DEBUG_BOXES) {
    ctx.strokeStyle = b.color
    ctx.lineWidth = 2
    ctx.setLineDash(b.dash ? [6, 4] : [])
    ctx.strokeRect((b.x - 1250) * k, b.y * k, b.width * k, b.height * k)
  }
  return out.toDataURL('image/jpeg', 0.8)
}
