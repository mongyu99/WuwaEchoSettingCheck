import { useEffect, useState } from 'react'
import ProcessingOverlay from './components/ProcessingOverlay'
import TopNav from './components/TopNav'
import SiteLayout from './components/SiteLayout'
import SiteFooter from './components/SiteFooter'
import HomePage from './pages/HomePage'
import PatchNotesPage from './pages/PatchNotesPage'
import EventCalendarPage from './pages/EventCalendarPage'
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
import { preprocessForOcr, MAX_IMAGES } from './utils/image'
import { prepareImageForExtraction } from './utils/pipeline'
import { saveState, loadState } from './utils/persist'
import { loadTheme, applyTheme } from './utils/theme'
import './App.css'

const EMPTY_BASE_STATS = { charAtk: '', weaponAtk: '', baseHp: '', baseDef: '' }

/** 예전 저장 형식(캐릭터당 에코 배열만 저장, 또는 에코 세트를 단일/배열로 저장하던 형식)과도
 * 호환되도록 레코드 모양을 항상 통일합니다. */
function normalizeRecord(rec) {
  if (Array.isArray(rec)) {
    return { echoes: rec, weapon: null, echoParts: null, baseStats: { ...EMPTY_BASE_STATS } }
  }
  return {
    echoes: rec?.echoes ?? [],
    weapon: rec?.weapon ?? null, // 무기 카탈로그 id (또는 null)
    // 사용자가 세트 추가/삭제로 직접 조립한 에코 세트 조합([{ setId, pieceCount }, ...])입니다.
    // null이면 캐릭터에게 등록된 추천 조합(config/characterEchoSets.js) 중 첫 번째를 기본값으로
    // 씁니다. 전부 삭제하면 빈 배열이 되어 "선택된 세트 없음" 상태입니다.
    echoParts: rec?.echoParts ?? null,
    // 사용자가 직접 고른 메인 에코 카탈로그 id입니다. null이면 지금 쓰는 조합에 호환되는(추천)
    // 메인 에코 중 첫 번째를 기본값으로 씁니다.
    mainEchoId: rec?.mainEchoId ?? null,
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
  const [page, setPage] = useState(saved?.page ?? 'home') // home | characters | patchnotes | events | capture | edit | stats
  const [character, setCharacter] = useState(savedCharacter)
  // 캐릭터 id별로 에코/무기/에코세트조합/기초스탯을 따로 보관합니다: { [characterId]: { echoes, weapon, echoParts, baseStats } }
  const [characterData, setCharacterData] = useState(saved?.characterData ?? {})
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [replacingId, setReplacingId] = useState(null)
  const [theme, setTheme] = useState(() => loadTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const record = normalizeRecord(character ? characterData[character.id] ?? {} : {})
  const echoes = record.echoes
  // 캐릭터 선택 화면에서 에코가 하나라도 등록된 캐릭터를 구분해 보여주기 위한 목록입니다.
  const charactersWithData = new Set(
    Object.keys(characterData).filter((id) => normalizeRecord(characterData[id]).echoes.length > 0),
  )

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

  const setEchoPartsForCurrent = (echoParts) => {
    updateRecordForCurrent((rec) => ({ ...rec, echoParts, mainEchoId: null }))
  }

  const setMainEchoIdForCurrent = (mainEchoId) => {
    updateRecordForCurrent((rec) => ({ ...rec, mainEchoId }))
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

  const updateMainStats = (id, mainStats) => {
    setEchoesForCurrent((prev) => prev.map((e) => (e.id === id ? { ...e, mainStats } : e)))
  }

  // 사진 없이 빈 에코 카드를 직접 추가합니다(메인/서브 스탯을 전부 손으로 채우는 용도).
  // 사진으로 캡처하는 것과 같은 한도(MAX_IMAGES=5)까지만 추가할 수 있습니다.
  const addManualEcho = () => {
    setEchoesForCurrent((prev) => {
      if (prev.length >= MAX_IMAGES) return prev
      const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      return [...prev, { id, previewUrl: null, cost: null, mainStats: [], subStats: [], failed: false }]
    })
  }

  const handleSelectCharacter = (c) => {
    setCharacter(c)
    const rec = normalizeRecord(characterData[c.id] ?? {})
    setPage(rec.echoes.length > 0 ? 'stats' : 'capture')
  }

  const goHome = () => setPage('home')
  const goToCharacters = () => setPage('characters')
  const goToPatchNotes = () => setPage('patchnotes')
  const goToEventCalendar = () => setPage('events')

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
            onUpdateMainStats={updateMainStats}
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
            echoParts={record.echoParts}
            mainEchoId={record.mainEchoId}
            onSetWeapon={setWeaponForCurrent}
            onSetEchoParts={setEchoPartsForCurrent}
            onSetMainEchoId={setMainEchoIdForCurrent}
            onUpdateSubStats={updateSubStats}
            onUpdateMainStats={updateMainStats}
            onAddEcho={addManualEcho}
            onGoToCharacters={goToCharacters}
            onReset={handleResetCurrent}
          />
        )
      case 'characters':
        return <CharacterSelectPage onSelect={handleSelectCharacter} charactersWithData={charactersWithData} />
      case 'patchnotes':
        return <PatchNotesPage />
      case 'events':
        return <EventCalendarPage />
      case 'home':
      default:
        return <HomePage onGoToPatchNotes={goToPatchNotes} />
    }
  }

  // SideNav는 '홈'·'캐릭터 목록'·'패치노트'·'이벤트 캘린더' 화면에서만 보이는 사이트 탐색용이라,
  // 실제 작업 화면(캡처/수정/스탯)에서는 숨깁니다. page-transition 애니메이션이 걸리는 key={page}
  // div 바깥에 둬서, 페이지가 전환될 때 SideNav까지 같이 리마운트·애니메이션되지 않게 합니다.
  const showSideNav = page === 'home' || page === 'characters' || page === 'patchnotes' || page === 'events'

  return (
    <>
      <TopNav
        onGoHome={goHome}
        theme={theme}
        onToggleTheme={toggleTheme}
        characterData={stripPreviewUrls(characterData)}
        onLoadCloudData={(loaded) => setCharacterData(loaded ?? {})}
      />

      <div className="app">
        {(isProcessing || replacingId) && (
          <ProcessingOverlay character={character} progress={progress} />
        )}

        <main className="app__flow">
          {showSideNav ? (
            <SiteLayout
              currentPage={page}
              onGoHome={goHome}
              onGoToCharacterList={goToCharacters}
              onGoToPatchNotes={goToPatchNotes}
              onGoToEventCalendar={goToEventCalendar}
            >
              {renderPage()}
            </SiteLayout>
          ) : (
            <div key={page} className="page-transition">
              {renderPage()}
            </div>
          )}
        </main>

        <SiteFooter />
      </div>
    </>
  )
}
