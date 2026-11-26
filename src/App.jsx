import { startTransition, useEffect, useRef, useState } from 'react'
import { SITE_URL, isBuildFlow, pageFromPath, routeOf } from './config/routes'
import ProcessingOverlay from './components/ProcessingOverlay'
import TopNav from './components/TopNav'
import SiteFooter from './components/SiteFooter'
import HomePage from './pages/HomePage'
import PatchNotesPage from './pages/PatchNotesPage'
import GuidePage from './pages/GuidePage'
import InfoPage from './pages/InfoPage'
import EventCalendarPage from './pages/EventCalendarPage'
import LiveEchoCheckPage from './pages/LiveEchoCheckPage'
import EchoBagPage from './pages/EchoBagPage'
import CharacterRecommendPage from './pages/CharacterRecommendPage'
import EventNotePage from './pages/EventNotePage'
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
import { getEchoCost } from './utils/ocr'
import { applyCostToMainStats } from './config/echoMainStats'
import { loadTheme, applyTheme } from './utils/theme'
import './App.css'

const EMPTY_BASE_STATS = { charAtk: '', weaponAtk: '', baseHp: '', baseDef: '' }

/** 예전 저장 형식(캐릭터당 에코 배열만 저장, 또는 에코 세트를 단일/배열로 저장하던 형식)과도
 * 호환되도록 레코드 모양을 항상 통일합니다. */
// 메인 옵션을 고르지 않은 에코는 저장하지 않습니다. 화면에서 편집하는 동안에는 남아 있고, 저장할 때만 빠집니다.
const hasMainOption = (echo) => !!echo.mainStats?.[0]?.label

const withFixedMainStats = (echo) => ({ ...echo, mainStats: applyCostToMainStats(echo.mainStats, getEchoCost(echo)) })

function normalizeRecord(rec) {
  if (Array.isArray(rec)) {
    return { echoes: rec, weapon: null, echoParts: null, baseStats: { ...EMPTY_BASE_STATS } }
  }
  return {
    // 예전에 저장한 에코도 코스트 기준 고정 수치로 맞춰서 읽습니다.
    echoes: (rec?.echoes ?? []).map(withFixedMainStats),
    weapon: rec?.weapon ?? null, // 무기 카탈로그 id (또는 null)
    weaponRank: rec?.weaponRank ?? 1, // 무기 돌파 단계(1~5)
    // 사용자가 세트 추가/삭제로 직접 조립한 에코 세트 조합([{ setId, pieceCount }, ...])입니다.
    // null이면 캐릭터에게 등록된 추천 조합(config/characterEchoSets.js) 중 첫 번째를 기본값으로
    // 씁니다. 전부 삭제하면 빈 배열이 되어 "선택된 세트 없음" 상태입니다.
    echoParts: rec?.echoParts ?? null,
    // 사용자가 직접 고른 메인 에코 카탈로그 id입니다. null이면 지금 쓰는 조합에 호환되는(추천)
    // 메인 에코 중 첫 번째를 기본값으로 씁니다.
    mainEchoId: rec?.mainEchoId ?? null,
    // 사용자가 직접 넣는 공명 효율 보정값(%)입니다. 탈것(바이크) 옵션처럼 계산에 없는 효과로 화면과 다를 때 맞추는 용도.
    // { on }: 체크하면 공명 효율 보정치(+30%)를 더합니다.
    erAdjust: { on: !!rec?.erAdjust?.on },
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
    const strippedEchoes = echoes.filter(hasMainOption).map(({ previewUrl, ...rest }) => rest)
    result[id] = Array.isArray(rec) ? strippedEchoes : { ...rec, echoes: strippedEchoes }
  }
  return result
}

const PAGE_KEY = 'wuwa-current-page'

export default function App() {
  // 보던 페이지는 탭 단위(sessionStorage)로만 기억합니다: 새로고침은 그대로, 새 탭·재방문은 메인부터.
  // 주소(/live-check 등)가 있으면 그 화면으로 엽니다. /build에서 새로고침하면 보던 캡처·결과 화면을 이어서 보여 주고,
  // 소셜 로그인 콜백(/auth/callback)처럼 화면 주소가 아니면 이 탭에서 보던 화면으로 돌아갑니다.
  const [page, setPage] = useState(() => {
    let savedPage = 'home'
    try {
      savedPage = sessionStorage.getItem(PAGE_KEY) ?? 'home'
    } catch {
      // sessionStorage를 못 쓰면 주소만 보고 고릅니다.
    }
    // 수정 중인 에코는 메모리에만 있어 새로고침하면 사라지므로, 캡처 화면으로 돌아갑니다.
    if (savedPage === 'edit') savedPage = 'capture'
    const fromPath = pageFromPath(window.location.pathname)
    if (fromPath === 'characters' && isBuildFlow(savedPage)) return savedPage
    if (fromPath) return fromPath
    return window.location.pathname.startsWith('/auth/') ? savedPage : 'home'
  }) // home | characters | patchnotes | events | capture | edit | stats
  const [character, setCharacter] = useState(savedCharacter)
  // 캐릭터 id별로 에코/무기/에코세트조합/기초스탯을 따로 보관합니다: { [characterId]: { echoes, weapon, echoParts, baseStats } }
  const [characterData, setCharacterData] = useState(saved?.characterData ?? {})
  // 캡처 후 수정 화면에서 고치는 중인 에코입니다. 메모리에만 두고, "완료"를 눌러야 characterData에 저장됩니다.
  const [draftEchoes, setDraftEchoes] = useState([])
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

  const characterEchoes = Object.fromEntries(
    Object.keys(characterData).map((id) => [id, normalizeRecord(characterData[id]).echoes.filter(hasMainOption)]),
  )

  // 진행 상태가 바뀔 때마다 저장해서, 브라우저를 나갔다 들어와도 이어서 볼 수 있게 합니다.
  useEffect(() => {
    saveState({ page, characterId: character?.id ?? null, characterData: stripPreviewUrls(characterData) })
  }, [page, character, characterData])

  useEffect(() => {
    try {
      sessionStorage.setItem(PAGE_KEY, page)
    } catch {
      // sessionStorage를 못 쓰면 새로고침 시 메인으로 갑니다.
    }
  }, [page])

  // 화면이 바뀌면 주소·탭 제목·검색 설명을 맞춥니다. 뒤로 가기로 온 화면은 기록에 이미 있어서(state.page가 같음) 또 쌓지 않습니다.
  const firstSync = useRef(true)
  useEffect(() => {
    const route = routeOf(page)
    if (firstSync.current) {
      firstSync.current = false
      // 첫 진입: 기록을 쌓지 않고 바꿉니다. ?token=…(로그인 콜백)은 AuthContext가 읽어야 하니 남겨 둡니다.
      window.history.replaceState({ page }, '', route.path + window.location.search + window.location.hash)
    } else if (window.history.state?.page !== page) {
      window.history.pushState({ page }, '', route.path)
    }
    document.title = route.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', route.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', SITE_URL + route.path)
  }, [page])

  useEffect(() => {
    const onPop = (e) => {
      let target = e.state?.page ?? pageFromPath(window.location.pathname) ?? 'home'
      // 수정 화면은 고치던 내용이 이미 저장·취소됐을 수 있어서, 뒤로 가기로는 캡처 화면으로 돌아갑니다.
      if (target === 'edit') target = 'capture'
      if (e.state?.page !== target) window.history.replaceState({ page: target }, '', window.location.pathname)
      startTransition(() => setPage(target))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const updateRecordForCurrent = (patcher) => {
    if (!character) return
    setCharacterData((prev) => {
      const current = normalizeRecord(prev[character.id] ?? {})
      return { ...prev, [character.id]: patcher(current) }
    })
  }

  const setEchoesForCurrent = (updater) => {
    if (page === 'edit') {
      setDraftEchoes(updater)
      return
    }
    updateRecordForCurrent((rec) => ({
      ...rec,
      echoes: typeof updater === 'function' ? updater(rec.echoes) : updater,
    }))
  }

  const setWeaponForCurrent = (weapon) => {
    updateRecordForCurrent((rec) => ({ ...rec, weapon, weaponRank: 1 }))
  }

  const setWeaponRankForCurrent = (weaponRank) => {
    updateRecordForCurrent((rec) => ({ ...rec, weaponRank }))
  }

  const setEchoPartsForCurrent = (echoParts) => {
    updateRecordForCurrent((rec) => ({ ...rec, echoParts, mainEchoId: null }))
  }

  const setMainEchoIdForCurrent = (mainEchoId) => {
    updateRecordForCurrent((rec) => ({ ...rec, mainEchoId }))
  }

  const setErAdjustForCurrent = (partial) => {
    updateRecordForCurrent((rec) => ({ ...rec, erAdjust: { ...rec.erAdjust, ...partial } }))
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
      // 사진마다 한 번씩 브라우저에 차례를 넘겨, 인식하는 동안에도 클릭·스크롤이 바로 반응하게 합니다.
      await new Promise((resolve) => setTimeout(resolve, 0))
      const item = perImage[i]
      const echo = await buildEchoFromCrops(item.id, item.crops, item.previewUrl)
      // 재인식에 쓰려고 잘라 둔 그림을 수정 화면이 끝날 때까지 메모리에 들고 있습니다.
      results.push({ ...withFixedMainStats(echo), crops: item.crops })
      setProgress((i + 1) / perImage.length)
    }

    setDraftEchoes(results)
    setIsProcessing(false)
    setProgress(0)
    setPage('edit')
  }

  const handleReplaceOne = async (id, file) => {
    setReplacingId(id)
    try {
      const { crops, previewUrl } = await prepareImageForExtraction(file)
      const updated = { ...withFixedMainStats(await buildEchoFromCrops(id, crops, previewUrl)), crops }
      setEchoesForCurrent((prev) => prev.map((e) => (e.id === id ? updated : e)))
    } catch (err) {
      console.error(err)
      alert(err.message || '사진 처리에 실패했어요. 다른 사진으로 다시 시도해주세요.')
    } finally {
      setReplacingId(null)
    }
  }

  /** 잘라 둔 그림으로 그 에코만 다시 인식합니다. 직접 고친 값은 인식 결과로 돌아갑니다. */
  const handleReRecognize = async (id) => {
    const target = draftEchoes.find((e) => e.id === id)
    if (!target?.crops) return
    setReplacingId(id)
    try {
      const updated = withFixedMainStats(await buildEchoFromCrops(id, target.crops, target.previewUrl))
      setDraftEchoes((prev) => prev.map((e) => (e.id === id ? { ...updated, crops: target.crops } : e)))
    } finally {
      setReplacingId(null)
    }
  }

  const updateSubStats = (id, subStats) => {
    setEchoesForCurrent((prev) => prev.map((e) => (e.id === id ? { ...e, subStats } : e)))
  }

  // 에코 순서 바꾸기(드래그해서 놓은 자리로): from번째 에코를 빼서 to번째에 끼웁니다.
  const moveEcho = (from, to) => {
    setEchoesForCurrent((prev) => {
      if (from === to || !prev[from] || to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const updateEchoCost = (id, cost) => {
    setEchoesForCurrent((prev) => prev.map((e) => (e.id === id ? { ...e, cost, mainStats: applyCostToMainStats(e.mainStats, cost) } : e)))
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

  /** 실시간 에코 체크에서 고른 캐릭터의 지정한 자리에 에코를 넣고 그 캐릭터 화면으로 이동합니다. 이미 있는 자리면 교체합니다. */
  const handleApplyLiveEcho = (target, echo, slot, stay = false) => {
    const rec = normalizeRecord(characterData[target.id] ?? {})
    const echoes = rec.echoes.filter(hasMainOption)
    if (slot < echoes.length) echoes[slot] = echo
    else echoes.push(echo)
    setCharacterData((prev) => ({ ...prev, [target.id]: { ...rec, echoes } }))
    // 바로 저장은 화면 공유를 끊지 않고 실시간 체크 화면에 그대로 머뭅니다.
    if (stay) return
    setCharacter(target)
    setPage('stats')
  }

  // 캐릭터 추천의 교체 팝업에서 고른 에코로 그 캐릭터의 저장된 에코를 바꿉니다(무기·세트 등 다른 설정은 그대로).
  const handleReplaceEchoes = (target, echoes) => {
    setCharacterData((prev) => ({ ...prev, [target.id]: { ...normalizeRecord(prev[target.id] ?? {}), echoes } }))
  }

  const handleCompleteEdit = () => {
    updateRecordForCurrent((rec) => ({ ...rec, echoes: draftEchoes.filter(hasMainOption).map(({ crops, ...echo }) => echo) }))
    setPage('stats')
  }

  // 메뉴·바로가기로 페이지를 옮길 때: 누른 반응(버튼 눌림)을 먼저 그리고, 무거운 새 페이지는 그 뒤에 그립니다(INP 개선).
  const navigate = (next) => startTransition(() => setPage(next))
  const goHome = () => navigate('home')
  const goToCharacters = () => navigate('characters')
  const goToPatchNotes = () => navigate('patchnotes')
  const goToGuide = () => navigate('guide')
  // 하단 안내(자주 묻는 질문·약관 등): 어느 항목을 펼칠지 함께 기억합니다.
  const [infoSection, setInfoSection] = useState('faq')
  const goToInfo = (section) => {
    setInfoSection(section)
    setPage('info')
    window.scrollTo(0, 0)
  }
  const goToEventCalendar = () => navigate('events')
  const goToEventNote = () => navigate('eventnote')
  const goToLiveCheck = () => navigate('live')
  const goToEchoBag = () => navigate('bag')
  // 캐릭터 추천으로 이동. 가방 정리에서 캐릭터를 골라 둔 채로 넘어오면 그 캐릭터를 바로 보여 줍니다.
  const [recommendCharacterId, setRecommendCharacterId] = useState(null)
  const goToRecommend = (characterId = null) => {
    setRecommendCharacterId(typeof characterId === 'string' ? characterId : null)
    setPage('recommend')
  }

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
            echoes={draftEchoes}
            onUpdateSubStats={updateSubStats}
            onUpdateMainStats={updateMainStats}
            onUpdateCost={updateEchoCost}
            onReplaceOne={handleReplaceOne}
            onReRecognize={handleReRecognize}
            replacingId={replacingId}
            onProceedToStats={handleCompleteEdit}
            onGoToCharacters={goToCharacters}
          />
        )
      case 'stats':
      case 'optimize':
        return (
          <StatsPage
            optimizeMode={page === 'optimize'}
            onOpenOptimizer={() => setPage('optimize')}
            onBackFromOptimizer={() => setPage('stats')}
            onStartMission={() => setPage('live')}
            echoes={echoes}
            character={character}
            weapon={record.weapon}
            weaponRank={record.weaponRank}
            onSetWeaponRank={setWeaponRankForCurrent}
            echoParts={record.echoParts}
            mainEchoId={record.mainEchoId}
            onSetWeapon={setWeaponForCurrent}
            onSetEchoParts={setEchoPartsForCurrent}
            onSetMainEchoId={setMainEchoIdForCurrent}
            erAdjust={record.erAdjust}
            onSetErAdjust={setErAdjustForCurrent}
            onUpdateSubStats={updateSubStats}
            onUpdateMainStats={updateMainStats}
            onUpdateCost={updateEchoCost}
            onReplaceOne={handleReplaceOne}
            onAddEcho={addManualEcho}
            onMoveEcho={moveEcho}
            onGoToCharacters={goToCharacters}
            onReset={handleResetCurrent}
          />
        )
      case 'characters':
        return <CharacterSelectPage onSelect={handleSelectCharacter} charactersWithData={charactersWithData} characterEchoes={characterEchoes} />
      case 'info':
        return <InfoPage key={infoSection} section={infoSection} />
      case 'guide':
        return <GuidePage />
      case 'patchnotes':
        return <PatchNotesPage />
      case 'live':
        return (
          <LiveEchoCheckPage
            onApplyEcho={handleApplyLiveEcho}
            onGoToSetup={handleSelectCharacter}
            characterEchoes={characterEchoes}
            characterData={characterData}
          />
        )
      case 'recommend':
        return (
          <CharacterRecommendPage
            initialCharacterId={recommendCharacterId}
            onGoToEchoBag={goToEchoBag}
            onReplaceEchoes={handleReplaceEchoes}
            characterEchoes={characterEchoes}
            characterData={characterData}
          />
        )
      case 'bag':
        return <EchoBagPage onGoToRecommend={goToRecommend} characterEchoes={characterEchoes} />
      case 'eventnote':
        return <EventNotePage />
      case 'events':
        return <EventCalendarPage />
      case 'home':
      default:
        return <HomePage onGoToEchoBag={goToEchoBag} onGoToCharacters={goToCharacters} onGoToLiveCheck={goToLiveCheck} />
    }
  }

  return (
    <>
      <TopNav
        currentPage={page}
        onGoHome={goHome}
        onGoToCharacterList={goToCharacters}
        onGoToPatchNotes={goToPatchNotes}
        onGoToGuide={goToGuide}
        onGoToEventCalendar={goToEventCalendar}
        onGoToEventNote={goToEventNote}
        onGoToLiveCheck={goToLiveCheck}
        onGoToEchoBag={goToEchoBag}
        onGoToRecommend={goToRecommend}
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
          <div key={page} className="page-transition">
            {renderPage()}
          </div>
        </main>

        <SiteFooter onOpenInfo={goToInfo} />
      </div>
    </>
  )
}
