import { useState } from 'react'
import ImageUploader from './components/ImageUploader'
import EchoPanel from './components/EchoPanel'
import { extractText, recognizeRegion, parseStatLines, buildStatsFromLines } from './utils/ocr'
import { detectHighlightedLines } from './utils/highlight'
import { preprocessForOcr } from './utils/image'
import './App.css'

export default function App() {
  const [echoes, setEchoes] = useState([]) // { id, previewUrl, mainStats, subStats, failed }
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const hasResults = echoes.length > 0

  const handleExtractAll = async (perImage) => {
    setIsProcessing(true)
    setProgress(0)

    const totalSteps = perImage.length * 2
    let doneSteps = 0
    const bump = () => {
      doneSteps += 1
      setProgress(doneSteps / totalSteps)
    }

    const results = []
    for (const item of perImage) {
      try {
        const [mainPre, subPre] = await Promise.all([
          preprocessForOcr(item.crops.mainStat),
          preprocessForOcr(item.crops.subStat),
        ])

        const [mainRaw, subResult] = await Promise.all([
          extractText(mainPre).then((t) => { bump(); return t }),
          recognizeRegion(subPre).then((r) => { bump(); return r }),
        ])

        const { stats: subStatsRaw, kept } = buildStatsFromLines(subResult.lines)
        const highlights = await detectHighlightedLines(item.crops.subStat, kept)
        const subStats = subStatsRaw.map((s, i) => ({ ...s, highlighted: !!highlights[i] })).slice(0, 5)

        results.push({
          id: item.id,
          previewUrl: item.previewUrl,
          mainStats: parseStatLines(mainRaw),
          subStats,
          failed: false,
        })
      } catch (err) {
        console.error(err)
        results.push({
          id: item.id,
          previewUrl: item.previewUrl,
          mainStats: [],
          subStats: [],
          failed: true,
        })
      }
    }

    setEchoes(results)
    setIsProcessing(false)
    setProgress(0)
  }

  const updateSubStats = (id, subStats) => {
    setEchoes((prev) => prev.map((e) => (e.id === id ? { ...e, subStats } : e)))
  }

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__eyebrow">ECHO SETTING CHECK</span>
        <h1>메아리 세팅, 숫자로 증명하세요</h1>
        <p>사진 최대 5장으로 서브스탯을 한 번에 읽고 확인·수정할 수 있어요.</p>
      </header>

      <main className="app__flow">
        <ImageUploader
          onExtractAll={handleExtractAll}
          isProcessing={isProcessing}
          progress={progress}
          compact={hasResults}
        />

        {hasResults && (
          <div className="echo-list">
            {echoes.map((echo, idx) => (
              <div className="echo-row" key={echo.id}>
                <div className="echo-row__thumb-wrap">
                  <img className="echo-row__thumb" src={echo.previewUrl} alt={`사진 ${idx + 1} 스캔 영역`} />
                </div>
                <EchoPanel echo={echo} index={idx} onUpdateSubStats={updateSubStats} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
