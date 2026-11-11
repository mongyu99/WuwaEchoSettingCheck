// 개발 서버 전용: 화면 인식 결과를 OCR 테스트 자료로 모읍니다. 운영 빌드에는 포함되지 않습니다.
// 브라우저가 POST /__ocr-sample 로 { image(dataURL), result } 를 보내면 test/ocr-fixtures/ 에
// <시각>.png(인식에 쓴 게임 화면)와 <시각>.json(인식 결과·OCR 원문)을 저장합니다.
import fs from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve('test/ocr-fixtures')

export default function ocrSamplePlugin() {
  return {
    name: 'ocr-sample',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__ocr-sample', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => {
          try {
            const { image, result } = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            fs.mkdirSync(OUT_DIR, { recursive: true })
            const name = new Date().toISOString().replace(/[:.]/g, '-')
            fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), Buffer.from(image.split(',')[1], 'base64'))
            fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(result, null, 2))
            res.statusCode = 204
          } catch (err) {
            server.config.logger.error(`[ocr-sample] ${err.message}`)
            res.statusCode = 400
          }
          res.end()
        })
      })
    },
  }
}
