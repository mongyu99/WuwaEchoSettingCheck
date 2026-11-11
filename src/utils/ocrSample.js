// 개발 서버에서만: 인식한 화면과 결과를 test/ocr-fixtures/ 에 저장해 OCR 테스트 자료로 씁니다.
// 운영 빌드에서는 import.meta.env.DEV가 false라 아무 일도 하지 않습니다.
export function saveOcrSample(area, recognized, source) {
  if (!import.meta.env.DEV) return
  const { views = [], ...result } = recognized
  fetch('/__ocr-sample', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: area.toDataURL('image/png'),
      // 정답과 비교할 인식 결과 + 영역별 OCR 원문(어디서 잘못 읽었는지 보기 위함)
      result: { source, ...result, ocrText: views.map(({ title, text }) => ({ title, text })) },
    }),
  }).catch(() => {})
}
