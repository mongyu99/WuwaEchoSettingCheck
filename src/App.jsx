import { useEffect, useState } from 'react'
import ProcessingOverlay from './components/ProcessingOverlay'
import CharacterSelectPage from './pages/CharacterSelectPage'
import CapturePage from './pages/CapturePage'
import EditPage from './pages/EditPage'
import StatsPage from './pages/StatsPage'
import { CHARACTERS } from './config/characters'
import {
  extractText,
  recognizeRegion,
  parseStatLines,
  buildStatsFromLines,
  normalizeMainStats,
  snapSubStatsToCatalog,
} from './utils/ocr'
import { detectHighlightedLines } from './utils/highlight'
import { preprocessForOcr } from './utils/image'
import { prepareImageForExtraction } from './utils/pipeline'
import { saveState, loadState } from './utils/persist'
import './App.css'

const saved = loadState()
const savedCharacter = saved?.characterId ? CHARACTERS.find((c) => c.id === saved.characterId) ?? null : null

export default function App() {
  const [page, setPage] = useState(saved?.page ?? 'characters') // characters | capture | edit | stats
  const [character, setCharacter] = useState(savedCharacter)
  // 캐릭터 id별로 에코 세팅을 따로 보관합니다: { [characterId]: echo[] }
  const [characterData, setCharacterData] = useState(saved?.characterData ?? {})
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [replacingId, setReplacingId] = useState(null)

  const echoes = character ? characterData[character.id] ?? [] : []

  // 진행 상태가 바뀔 때마다 저장해서, 브라우저를 나갔다 들어와도 이어서 볼 수 있게 합니다.
  useEffect(() => {
    saveState({ page, characterId: character?.id ?? null, characterData })
  }, [page, character, characterData])

  const setEchoesForCurrent = (updater) => {
    if (!character) return
    setCharacterData((prev) => {
      const current = prev[character.id] ?? []
      const next = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [character.id]: next }
    })
  }

  /** 크롭된 이미지 3종(메인/서브 스탯, 미리보기)으로부터 결과 카드 하나를 만듭니다. */
  const buildEchoFromCrops = async (id, crops, previewUrl) => {
    try {
      const [mainPre, subPre] = await Promise.all([
        preprocessForOcr(crops.mainStat),
        preprocessForOcr(crops.subStat),
      ])
      const [mainRaw, subResult] = await Promise.all([
        extractText(mainPre),
        recognizeRegion(subPre),
      ])

      const { stats: subStatsRaw, kept } = buildStatsFromLines(subResult.lines)
      const highlights = await detectHighlightedLines(crops.subStat, kept)
      const subStats = snapSubStatsToCatalog(
        subStatsRaw.map((s, i) => ({ ...s, highlighted: !!highlights[i] })).slice(0, 5),
      )

      return {
        id,
        previewUrl,
        mainStats: normalizeMainStats(parseStatLines(mainRaw)),
        subStats,
        failed: false,
      }
    } catch (err) {
      console.error(err)
      return { id, previewUrl, mainStats: [], subStats: [], failed: true }
    }
  }

  const handleExtractAll = async (perImage) => {
    setIsProcessing(true)
    setProgress(0)

    const results = []
    for (let i = 0; i < perImage.length; i++) {
      const item = perImage[i]
      const echo = await buildEchoFromCrops(item.id, item.crops, item.previewUrl)
      results.push(echo)
      setProgress((i + 1) / perImage.length)
    }

    setEchoesForCurrent(() => results)
    setIsProcessing(false)
    setProgress(0)
    setPage('edit')
  }

  const handleReplaceOne = async (id, file) => {
    setReplacingId(id)
    try {
      const { crops, previewUrl } = await prepareImageForExtraction(file)
      const updated = await buildEchoFromCrops(id, crops, previewUrl)
      setEchoesForCurrent((prev) => prev.map((e) => (e.id === id ? updated : e)))
    } catch (err) {
      console.error(err)
      alert(err.message || '사진 처리에 실패했어요. 다른 사진으로 다시 시도해주세요.')
    } finally {
      setReplacingId(null)
    }
  }

  const updateSubStats = (id, subStats) => {
    setEchoesForCurrent((prev) => prev.map((e) => (e.id === id ? { ...e, subStats } : e)))
  }

  const handleSelectCharacter = (c) => {
    setCharacter(c)
    const existing = characterData[c.id]
    setPage(existing && existing.length > 0 ? 'stats' : 'capture')
  }

  const goToCharacters = () => setPage('characters')

  const handleResetCurrent = () => {
    if (!character) {
      goToCharacters()
      return
    }
    setCharacterData((prev) => {
      const next = { ...prev }
      delete next[character.id]
      return next
    })
    setCharacter(null)
    setPage('characters')
  }

  const renderPage = () => {
    switch (page) {
      case 'capture':
        return (
          <CapturePage
            character={character}
            onExtractAll={handleExtractAll}
            isProcessing={isProcessing}
            progress={progress}
            onGoToCharacters={goToCharacters}
          />
        )
      case 'edit':
        return (
          <EditPage
            echoes={echoes}
            onUpdateSubStats={updateSubStats}
            onReplaceOne={handleReplaceOne}
            replacingId={replacingId}
            onProceedToStats={() => setPage('stats')}
            onGoToCharacters={goToCharacters}
          />
        )
      case 'stats':
        return (
          <StatsPage
            echoes={echoes}
            character={character}
            onGoToCharacters={goToCharacters}
            onReset={handleResetCurrent}
          />
        )
      case 'characters':
      default:
        return <CharacterSelectPage onSelect={handleSelectCharacter} characterData={characterData} />
    }
  }

  return (
    <div className="app">
      {(isProcessing || replacingId) && (
        <ProcessingOverlay character={character} progress={progress} />
      )}

      <header className="app__header">
        <span className="app__eyebrow">ECHO SETTING CHECK</span>
        <h1>메아리 세팅, 숫자로 증명하세요</h1>
        <p>사진 최대 5장으로 서브스탯을 한 번에 읽고 확인·수정하고 점수까지 매겨보세요.</p>
      </header>

      <main className="app__flow">
        <div key={page} className="page-transition">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
