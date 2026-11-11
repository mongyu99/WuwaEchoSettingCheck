import { motionOff } from './motion'
// 새 결과가 들어왔을 때 상자가 젤리처럼 살짝 눌렸다 펴지는 효과입니다(squash & stretch).
// 내용을 다시 그리지 않고 상자만 움직여서, 입력 중인 칸이나 선택 상태가 그대로 유지됩니다.
export function jelly(element) {
  if (!element?.animate || motionOff()) return
  element.animate(
    [
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.025, 0.975)', offset: 0.25 },
      { transform: 'scale(0.99, 1.012)', offset: 0.5 },
      { transform: 'scale(1.004, 0.997)', offset: 0.75 },
      { transform: 'scale(1, 1)' },
    ],
    { duration: 480, easing: 'ease-out' },
  )
}
