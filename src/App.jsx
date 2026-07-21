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
  parseCost,
  inferCostFromMainStats,
} from './utils/ocr'
import { detectHighlightedLines } from './utils/highlight'
import { preprocessForOcr } from './utils/image'
import { prepareImageForExtraction } from './utils/pipeline'
import { saveState, loadState } from './utils/persist'
import './App.css'

const EMPTY_BASE_STATS = { charAtk: '', weaponAtk: '', baseHp: '', baseDef: '' }

/** 예전 저장 형식(캐릭터당 에코 배열만 저장, 또는 에코 세트를 배열로 저장하던 형식)과도 호환되도록
 * 레코드 모양을 항상 통일합니다. */
function normalizeRecord(rec) {
  if (Array.isArray(rec)) {
    return { echoes: rec, weapon: null, echoSetId: null, baseStats: { ...EMPTY_BASE_STATS } }
  }
  // 예전엔 에코 세트를 [{ setId, pieceCount }] 배열로 여러 개 저장했습니다. 이제는 캐릭터당 하나만
  // 고르는 select라, 예전 데이터가 있으면 첫 번째 세트만 살려서 이어갑니다.
  const legacyEchoSetId = Array.isArray(rec?.echoSets) ? rec.echoSets[0]?.setId ?? null : null
  return {
    echoes: rec?.echoes ?? [],
    weapon: rec?.weapon ?? null, // 무기 카탈로그 id (또는 null)
    echoSetId: rec?.echoSetId ?? legacyEchoSetId, // 에코 세트 카탈로그 id (또는 null)
    // 메인 에코는 더 이상 따로 저장하지 않습니다 — 고른 에코 세트에서 항상 자동으로 정해집니다
    // (config/mainEchoes.js의 getMainEchoForSet).
    baseStats: { ...EMPTY_BASE_STATS, ...(rec?.baseStats ?? {}) },
  }
}

const saved = loadState()
const savedCharacter = saved?.characterId ? CHARACTERS.find((c) => c.id === saved.characterId) ?? null : null

/**
 * echo.previewUrl은 사진 전체를 base64로 담고 있어서 용량이 큽니다. 캐릭터를 여러 명 쓰다 보면
 * localStorage 용량(보통 5~10MB)을 넘겨서 저장이 조용히 실패하고, 새로고침하면 마지막으로 저장에
 * "성공했던" 훨씬 예전 상태로 되돌아가는 문제가 있었습니다. previewUrl은 캡처 직후 "사진 교체"
 * 미리보기에만 쓰이고 점수 계산엔 필요 없어서, 저장할 때는 빼고 메모리(현재 세션)에만 유지합니다.
 */
function stripPreviewUrls(characterData) {
  const result = {}
  for (const [id, rec] of Object.entries(characterData)) {
    const echoes = Array.isArray(rec) ? rec : rec?.echoes
    if (!Array.isArray(echoes)) {
      result[id] = rec
      continue
    }
    const strippedEchoes = echoes.map(({ previewUrl, ...rest }) => rest)
    result[id] = Array.isArray(rec) ? strippedEchoes : { ...rec, echoes: strippedEchoes }
  }
  return result
}

export default function App() {
  const [page, setPage] = useState(saved?.page ?? 'characters') // characters | capture | edit | stats
  const [character, setCharacter] = useState(savedCharacter)
  // 캐릭터 id별로 에코/무기/에코세트/기초스탯을 따로 보관합니다: { [characterId]: { echoes, weapon, echoSetId, baseStats } }
  const [characterData, setCharacterData] = useState(saved?.characterData ?? {})
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [replacingId, setReplacingId] = useState(null)

  const record = normalizeRecord(character ? characterData[character.id] ?? {} : {})
  const echoes = record.echoes

  // 진행 상태가 바뀔 때마다 저장해서, 브라우저를 나갔다 들어와도 이어서 볼 수 있게 합니다.
  useEffect(() => {
    saveState({ page, characterId: character?.id ?? null, characterData: stripPreviewUrls(characterData) })
  }, [page, character, characterData])

  const updateRecordForCurrent = (patcher) => {
    if (!character) return
    setCharacterData((prev) => {
      const current = normalizeRecord(prev[character.id] ?? {})
      return { ...prev, [character.id]: patcher(current) }
    })
  }

  const setEchoesForCurrent = (updater) => {
    updateRecordForCurrent((rec) => ({
      ...rec,
      echoes: typeof updater === 'function' ? updater(rec.echoes) : updater,
    }))
  }

  const setWeaponForCurrent = (weapon) => {
    updateRecordForCurrent((rec) => ({ ...rec, weapon }))
  }

  const setEchoSetForCurrent = (echoSetId) => {
    updateRecordForCurrent((rec) => ({ ...rec, echoSetId }))
  }

  const setBaseStatsForCurrent = (partial) => {
    updateRecordForCurrent((rec) => ({ ...rec, baseStats: { ...rec.baseStats, ...partial } }))
  }

  /** 크롭된 이미지 3종(메인/서브 스탯, 미리보기)으로부터 결과 카드 하나를 만듭니다. */
  const buildEchoFromCrops = async (id, crops, previewUrl) => {
    try {
      const [costPre, mainPre, subPre] = await Promise.all([
        crops.cost ? preprocessForOcr(crops.cost) : Promise.resolve(null),
        preprocessForOcr(crops.mainStat),
        preprocessForOcr(crops.subStat),
      ])
      const [costRaw, mainRaw, subResult] = await Promise.all([
        costPre ? extractText(costPre) : Promise.resolve(''),
        extractText(mainPre),
        recognizeRegion(subPre),
      ])

      const { stats: subStatsRaw, kept } = buildStatsFromLines(subResult.lines)
      const highlights = await detectHighlightedLines(crops.subStat, kept)
      const subStats = snapSubStatsToCatalog(
        subStatsRaw.map((s, i) => ({ ...s, highlighted: !!highlights[i] })).slice(0, 5),
      )
      const mainStats = normalizeMainStats(parseStatLines(mainRaw))

      return {
        id,
        previewUrl,
        cost: inferCostFromMainStats(mainStats) ?? parseCost(costRaw),
        mainStats,
        subStats,
        failed: false,
      }
    } catch (err) {
      console.error(err)
      return { id, previewUrl, cost: null, mainStats: [], subStats: [], failed: true }
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
    const rec = normalizeRecord(characterData[c.id] ?? {})
    setPage(rec.echoes.length > 0 ? 'stats' : 'capture')
  }

  const goToCharacters = () => setPage('characters')

  /** 초기화: 이 캐릭터의 캡처된 에코만 지우고, 다시 캡처할 수 있도록 캡처 화면으로 이동합니다. */
  const handleResetCurrent = () => {
    if (!character) {
      goToCharacters()
      return
    }
    updateRecordForCurrent((rec) => ({ ...rec, echoes: [] }))
    setPage('capture')
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
            weapon={record.weapon}
            echoSetId={record.echoSetId}
            onSetWeapon={setWeaponForCurrent}
            onSetEchoSet={setEchoSetForCurrent}
            onUpdateSubStats={updateSubStats}
            onGoToCharacters={goToCharacters}
            onReset={handleResetCurrent}
          />
        )
      case 'characters':
      default:
        return <CharacterSelectPage onSelect={handleSelectCharacter} />
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
