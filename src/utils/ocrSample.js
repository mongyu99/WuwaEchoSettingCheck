// 개발 서버에서만: 인식한 화면과 결과를 test/ocr-fixtures/ 에 저장해 OCR 테스트 자료로 씁니다.
// 운영 빌드에서는 import.meta.env.DEV가 false라 아무 일도 하지 않습니다.
export function saveOcrSample(area, recognized, source) {
  if (!import.meta.env.DEV) return
  const { views = [], ...result } = recognized
  // toDataURL은 큰 화면에서 PNG를 만드는 동안 화면 확인을 멈추게 해서, 따로(비동기) 만듭니다.
  area.toBlob(async (blob) => {
    if (!blob) return
    const image = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
    fetch('/__ocr-sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image,
        // 정답과 비교할 인식 결과 + 영역별 OCR 원문(어디서 잘못 읽었는지 보기 위함)
        result: { source, ...result, ocrText: views.map(({ title, text }) => ({ title, text })) },
      }),
    }).catch(() => {})
  }, 'image/png')
}
