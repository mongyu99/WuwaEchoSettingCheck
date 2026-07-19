import { useState } from 'react'
import { getValidOptions } from '../config/characterValidOptions'
import { getCharacterBaseStats } from '../config/characterBaseStats'
import { WEAPONS, getWeapon } from '../config/weapons'
import { ECHO_SETS, getEchoSet } from '../config/echoSets'
import { runOptimizerFromGap } from '../utils/optimizer'
import ConfirmDialog from '../components/ConfirmDialog'
import EchoPanel from '../components/EchoPanel'
import Modal from '../components/Modal'
import './StatsPage.css'

// 합산 스탯에 보여줄 카테고리와, 우리 카탈로그 라벨(메인/서브 공통, % 유무 무관)과의 매칭
// 에코 피해는 맨 아래로
const CATEGORY_BASE_NAMES = {
  HP: ['HP'],
  공격력: ['공격력'],
  방어력: ['방어력'],
  '공명 효율': ['공명 효율'],
  크리티컬: ['크리티컬'],
  '크리티컬 피해': ['크리티컬 피해'],
  '속성 피해 보너스': [
    '속성 피해 보너스',
    '물리 피해 보너스',
    '응결 피해 보너스',
    '용융 피해 보너스',
    '전도 피해 보너스',
    '기류 피해 보너스',
    '회절 피해 보너스',
    '인멸 피해 보너스',
  ],
  '일반 공격 피해': ['일반 공격 피해', '일반 공격 피해 보너스'],
  '강공격 피해': ['강공격 피해', '강공격 피해 보너스'],
  '공명 스킬 피해': ['공명 스킬 피해', '공명 스킬 피해 보너스'],
  '공명 해방 피해': ['공명 해방 피해', '공명 해방 피해 보너스'],
  '에코 피해': ['에코 피해'],
}
const CATEGORY_ORDER = Object.keys(CATEGORY_BASE_NAMES)
const BASE_TOTAL_CATEGORIES = new Set(['HP', '공격력', '방어력', '공명 효율', '크리티컬', '크리티컬 피해'])
const OPTIMIZER_TARGET_ORDER = ['HP', '공격력', '방어력', '크리티컬', '크리티컬 피해', '공명 효율']

function stripPercent(label) {
  return label.endsWith('%') ? label.slice(0, -1) : label
}

function matchCategory(label) {
  const base = stripPercent(label)
  for (const [cat, names] of Object.entries(CATEGORY_BASE_NAMES)) {
    if (names.includes(base)) return cat
  }
  return null
}

// HP는 소수점 무조건 올림, 공격력·방어력은 무조건 내림 (셋 다 정수로 표시)
const formatWholeStat = (cat, n) => (cat === 'HP' ? Math.ceil(n) : Math.floor(n))
// 그 외 전부(공명 효율·크리티컬·크리티컬 피해 포함)는 항상 소수점 한 자리까지 표기 (예: 1.0%)
const formatPercent1 = (n) => n.toFixed(1)

/**
 * 캐릭터 고유 보너스 + 무기 + 에코 세트(2세트 효과만) + 캡처된 에코(메인+서브)를 전부 더해서
 * 카테고리별 %합계/플랫합계를 냅니다. 5세트 효과는 계산에 반영하지 않고 안내 문구로만 보여줍니다.
 */
function computeAggregate({ echoes, character, weaponId, echoSetSelections }) {
  const raw = {}
  for (const cat of CATEGORY_ORDER) raw[cat] = { percentSum: 0, flatSum: 0 }
  const addPercent = (cat, val) => {
    if (raw[cat]) raw[cat].percentSum += val
  }

  const baseStats = getCharacterBaseStats(character?.id)
  if (baseStats) {
    for (const b of baseStats.innateBonuses ?? []) addPercent(b.category, b.value)
  }

  const weapon = getWeapon(weaponId)
  if (weapon) {
    if (weapon.subStat) addPercent(weapon.subStat.category, weapon.subStat.value)
    for (const b of weapon.bonuses ?? []) addPercent(b.category, b.value)
  }

  for (const sel of echoSetSelections) {
    const set = getEchoSet(sel.setId)
    if (!set) continue
    // 5세트를 선택했어도 2세트 효과까지만 계산합니다(5세트는 계산에 반영하지 않음).
    const twoPiece = set.pieces?.[2]
    if (sel.pieceCount >= 2 && twoPiece) {
      for (const b of twoPiece.bonuses ?? []) addPercent(b.category, b.value)
    }
  }

  for (const echo of echoes) {
    for (const s of [...echo.mainStats, ...echo.subStats]) {
      if (!s.label || !s.valueText) continue
      const cat = matchCategory(s.label)
      if (!cat) continue
      const num = parseFloat(s.valueText)
      if (Number.isNaN(num)) continue
      if (s.valueText.includes('%')) raw[cat].percentSum += num
      else raw[cat].flatSum += num
    }
  }

  return { raw, baseStats, weapon }
}

/** 카테고리별 "기준(캐릭터+무기) / 합산 총합 / 추가분" 을 계산합니다. */
function computeCategoryTotal(cat, raw, baseStats, weapon) {
  switch (cat) {
    case 'HP': {
      const base = baseStats?.hp ?? 0
      const total = base * (1 + raw.percentSum / 100) + raw.flatSum
      return { base, total, additional: total - base }
    }
    case '공격력': {
      const base = (baseStats?.atk ?? 0) + (weapon?.atk ?? 0)
      const total = base * (1 + raw.percentSum / 100) + raw.flatSum
      return { base, total, additional: total - base }
    }
    case '방어력': {
      const base = baseStats?.def ?? 0
      const total = base * (1 + raw.percentSum / 100) + raw.flatSum
      return { base, total, additional: total - base }
    }
    case '공명 효율': {
      const base = baseStats?.energyRegen ?? 0
      const total = base + raw.percentSum
      return { base, total, additional: raw.percentSum }
    }
    case '크리티컬': {
      const base = baseStats?.critRate ?? 0
      const total = base + raw.percentSum
      return { base, total, additional: raw.percentSum }
    }
    case '크리티컬 피해': {
      const base = baseStats?.critDmg ?? 0
      const total = base + raw.percentSum
      return { base, total, additional: raw.percentSum }
    }
    default:
      return null
  }
}

function WeaponPickerModal({ open, onClose, onSelect, weaponType }) {
  const list = Object.entries(WEAPONS).filter(([, w]) => !weaponType || w.type === weaponType)
  return (
    <Modal open={open} title="무기 선택" onClose={onClose}>
      {list.length === 0 && <p className="uploader__hint">이 캐릭터가 쓸 수 있는 무기가 카탈로그에 없어요.</p>}
      {list.map(([id, w]) => (
        <button key={id} className="picker-item picker-item--simple" onClick={() => onSelect(id)}>
          {w.icon && <img src={w.icon} alt={w.name} className="picker-item__icon" />}
          <span>{w.name}</span>
        </button>
      ))}
    </Modal>
  )
}

function EchoSetPickerModal({ open, onClose, onSelect, remainingPieces }) {
  return (
    <Modal open={open} title="에코 세트 선택" onClose={onClose}>
      <p className="uploader__hint">
        캐릭터는 에코 5개까지만 착용할 수 있어서, 세트 조각 합이 5개를 넘지 않게 골라주세요
        (예: 2+2+1, 2+3, 5). 지금 남은 자리: {remainingPieces}개.
      </p>
      {Object.entries(ECHO_SETS).map(([id, set]) => (
        <div key={id} className="picker-item picker-item--set">
          {set.icon && <img src={set.icon} alt={set.name} className="picker-item__icon" />}
          <div className="picker-item__body">
            <strong>{set.name}</strong>
          </div>
          <div className="picker-item__actions">
            {Object.keys(set.pieces ?? {})
              .sort((a, b) => Number(a) - Number(b))
              .filter((n) => Number(n) <= remainingPieces)
              .map((n) => (
                <button key={n} className="btn btn--ghost" onClick={() => onSelect(id, Number(n))}>
                  {n}세트로 추가
                </button>
              ))}
            {Object.keys(set.pieces ?? {}).every((n) => Number(n) > remainingPieces) && (
              <span className="stats-page__chip-note">남은 자리가 부족해요.</span>
            )}
          </div>
        </div>
      ))}
    </Modal>
  )
}

const BASE_ONLY_CATEGORIES = new Set(['HP', '공격력', '방어력'])

function OptimizerPanel({ echoes, validLabels, raw, baseStats, weaponData, onResultsChange, onFocusEcho }) {
  const [targets, setTargets] = useState({})
  const [ran, setRan] = useState(false)
  const [results, setResults] = useState({})

  const handleCalculate = () => {
    const out = {}
    for (const cat of OPTIMIZER_TARGET_ORDER) {
      const t = parseFloat(targets[cat])
      if (!t || t <= 0) continue
      const calc = computeCategoryTotal(cat, raw[cat], baseStats, weaponData)
      const gapValue = t - calc.total
      const r = runOptimizerFromGap({
        category: cat,
        gapValue,
        base: BASE_ONLY_CATEGORIES.has(cat) ? calc.base : null,
        echoes,
        validLabels,
      })
      out[cat] = { ...r, currentTotal: calc.total, margin: calc.total - t }
    }
    // 어떤 목표를 이미 여유 있게 달성했는데 다른 목표는 아직 부족하다면, 옵션을 옮길 수도 있다고 안내
    const anyShort = Object.values(out).some((r) => !r.achieved)
    for (const r of Object.values(out)) {
      r.showReallocateHint = r.achieved && anyShort && r.margin > 0
    }
    setResults(out)
    setRan(true)
    onResultsChange?.(out)
  }

  return (
    <div className="optimizer">
      <h4 className="stats-page__col-title">목표 스탯 계산기</h4>
      <p className="uploader__hint optimizer__hint">
        목표를 채우고 "계산하기"를 누르면, 지금 합산 스탯 기준으로 몇이 부족한지, 1순위(빈 자리
        채우기)·2순위(민맥싱)로 어떤 에코의 어떤 스탯을 바꾸면 가장 빠른지 알려드려요. 0이면 계산하지
        않습니다.
      </p>

      <div className="optimizer__grid">
        {OPTIMIZER_TARGET_ORDER.map((cat) => (
          <label key={cat} className="optimizer__field">
            {cat}
            <input
              type="number"
              placeholder="0"
              value={targets[cat] ?? ''}
              onChange={(e) => setTargets((prev) => ({ ...prev, [cat]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <button className="btn btn--primary optimizer__calc-btn" onClick={handleCalculate}>계산하기</button>

      {ran && (
        <div className="optimizer__results">
          {OPTIMIZER_TARGET_ORDER.filter((cat) => results[cat]).map((cat) => {
            const r = results[cat]
            return (
              <div className="optimizer__result" key={cat}>
                <p className="optimizer__result-title">{cat}</p>
                {r.achieved ? (
                  <>
                    <p>이미 목표를 달성했어요! (현재 약 {Math.round(r.currentTotal * 10) / 10})</p>
                    {r.showReallocateHint && (
                      <p className="optimizer__estimate">옵션 변경도 가능해요. (여유분을 다른 목표로 돌릴 수 있어요)</p>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      현재 약 <strong>{Math.round(r.currentTotal * 10) / 10}</strong> → 약{' '}
                      <strong>{r.neededPercentTotal?.toFixed(1)}%</strong> 상당 더 필요해요.
                    </p>
                    {r.steps?.length === 0 ? (
                      <p className="optimizer__estimate">추천할 자리가 없어요 (자리 부족 또는 이미 최고 단계).</p>
                    ) : (
                      <ol className="optimizer__steps">
                        {r.steps?.map((s, i) => (
                          <li key={i}>
                            <button className="optimizer__step-btn" onClick={() => onFocusEcho?.(s.echoIndex)}>
                              <strong>에코 {s.echoIndex + 1}</strong>
                              {s.action === 'add'
                                ? `의 빈 자리에 ${s.label} ${s.toValue} 추가`
                                : s.action === 'replace'
                                  ? `의 유효 옵션이 아닌 ${s.fromLabel}(${s.fromValue})을 ${s.label} ${s.toValue}로 교체`
                                  : `의 ${s.label}를 ${s.fromValue} → ${s.toValue}로 업그레이드`}
                              <span className="optimizer__gain"> (+{s.gain.toFixed(1)}%)</span>
                            </button>
                            {s.altFlat && (
                              <p className="optimizer__estimate optimizer__alt">
                                또는 플랫 {s.altFlat.label} {s.altFlat.value}로 채워도 도움이 돼요.
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </div>
            )
          })}
          {Object.keys(results).length === 0 && (
            <p className="optimizer__estimate">목표를 하나 이상 0보다 크게 입력해주세요.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function StatsPage({
  echoes,
  character,
  weapon,
  echoSets,
  onSetWeapon,
  onSetEchoSets,
  onUpdateSubStats,
  onGoToCharacters,
  onReset,
}) {
  const [resetOpen, setResetOpen] = useState(false)
  const [weaponModalOpen, setWeaponModalOpen] = useState(false)
  const [setModalOpen, setSetModalOpen] = useState(false)
  const [selectedEchoIdx, setSelectedEchoIdx] = useState(0)
  const [optimizerResults, setOptimizerResults] = useState({})
  const [echoEditorOpen, setEchoEditorOpen] = useState(false)
  const validLabels = getValidOptions(character?.id)

  const focusEcho = (idx) => {
    setSelectedEchoIdx(idx)
    setEchoEditorOpen(true)
  }

  const suggestedLabelsForSelected = []
  Object.values(optimizerResults).forEach((r) => {
    r?.steps?.forEach((s) => {
      if (s.echoIndex !== selectedEchoIdx) return
      if (s.action === 'replace') suggestedLabelsForSelected.push(s.fromLabel)
      else if (s.action === 'upgrade') suggestedLabelsForSelected.push(s.label)
    })
  })

  const { raw: aggregate, baseStats, weapon: weaponData } = computeAggregate({
    echoes,
    character,
    weaponId: weapon,
    echoSetSelections: echoSets,
  })

  const removeEchoSet = (i) => onSetEchoSets(echoSets.filter((_, idx) => idx !== i))
  const totalEchoSetPieces = echoSets.reduce((sum, s) => sum + s.pieceCount, 0)

  return (
    <section className="stats-page">
      <header className="stats-page__head">
        <div className="stats-page__head-top">
          <span className="uploader__eyebrow">점수 통계</span>
          <div className="stats-page__head-actions">
            <button className="capture-page__back" onClick={() => setResetOpen(true)}>초기화</button>
            <button className="capture-page__back" onClick={onGoToCharacters}>← 캐릭터 선택으로</button>
          </div>
        </div>
        <h2>캐릭터의 유효 옵션 기준으로 서브 스탯을 확인합니다</h2>
        <p className="uploader__hint">여기서 바로 스탯을 수정할 수 있어요. 노란색 항목만 유효 옵션입니다.</p>
      </header>

      <div className="echo-editor-wrap">
        <button className="echo-editor__toggle" onClick={() => setEchoEditorOpen((o) => !o)}>
          에코 상세 설정 {echoEditorOpen ? '접기 ▲' : '펼치기 ▼'}
        </button>

        {echoEditorOpen && (
          <div className="echo-editor">
            <div className="echo-editor__tabs">
              {echoes.length === 0 && <p className="echo-panel__empty">등록된 에코가 없어요.</p>}
              {echoes.map((echo, idx) => (
                <button
                  key={echo.id}
                  className={`echo-tab ${selectedEchoIdx === idx ? 'echo-tab--active' : ''}`}
                  onClick={() => setSelectedEchoIdx(idx)}
                >
                  에코 {idx + 1}
                </button>
              ))}
            </div>

            <div className="echo-editor__panel">
              {echoes[selectedEchoIdx] && (
                <EchoPanel
                  echo={echoes[selectedEchoIdx]}
                  index={selectedEchoIdx}
                  onUpdateSubStats={onUpdateSubStats}
                  validLabels={validLabels}
                  suggestedLabels={suggestedLabelsForSelected}
                />
              )}
            </div>

            <div className="echo-editor__placeholder">
              <h4 className="stats-page__col-title">추가 예정</h4>
              <p className="uploader__hint">디자인만 먼저 잡아둔 자리예요. 어떤 내용을 넣을지 알려주시면 채워드릴게요.</p>
            </div>
          </div>
        )}
      </div>

      <div className="stats-page__columns">
        <aside className="stats-page__char">
          {character?.image ? (
            <img className="stats-page__char-photo" src={character.image} alt={character.name} />
          ) : (
            <div className="stats-page__char-photo stats-page__char-photo--fallback" style={{ background: character?.color }}>
              {character?.initials}
            </div>
          )}
          <h3>{character?.name ?? '캐릭터 미선택'}</h3>

          <h4>사용 무기</h4>
          {weaponData ? (
            <div className="stats-page__chip-card">
              <button className="stats-page__chip-head stats-page__chip-head--btn" onClick={() => setWeaponModalOpen(true)}>
                {weaponData.icon && <img src={weaponData.icon} alt={weaponData.name} />}
                <span>{weaponData.name}</span>
              </button>
              {weaponData.description && (
                <>
                  {weaponData.passiveName && <p className="stats-page__chip-passive">[{weaponData.passiveName}]</p>}
                  <p className="stats-page__chip-effect">{weaponData.description}</p>
                </>
              )}
            </div>
          ) : (
            <button className="btn btn--ghost stats-page__pick-btn" onClick={() => setWeaponModalOpen(true)}>
              + 무기 선택
            </button>
          )}

          <h4>사용 에코 세트</h4>
          <ul className="stats-page__chip-list">
            {echoSets.map((sel, i) => {
              const set = getEchoSet(sel.setId)
              const activeEffects = Object.entries(set?.pieces ?? {})
                .filter(([n]) => sel.pieceCount >= Number(n))
                .sort((a, b) => Number(a[0]) - Number(b[0]))
              return (
                <li key={i} className="stats-page__chip-card">
                  <div className="stats-page__chip-head">
                    {set?.icon && <img src={set.icon} alt={set.name} />}
                    <span>{set?.name ?? sel.setId}</span>
                    <button onClick={() => removeEchoSet(i)} aria-label="에코 세트 삭제">×</button>
                  </div>
                  {activeEffects.map(([n, effect]) => (
                    <p key={n} className="stats-page__chip-effect">
                      {n}세트: {effect.description}
                    </p>
                  ))}
                </li>
              )
            })}
          </ul>
          {totalEchoSetPieces < 5 && (
            <button className="btn btn--ghost stats-page__pick-btn" onClick={() => setSetModalOpen(true)}>
              + 에코 세트 추가
            </button>
          )}

          <h4>유효 옵션</h4>
          <ul className="stats-page__valid-list">
            {validLabels.length === 0 && <li className="echo-panel__empty">설정된 유효 옵션 없음</li>}
            {validLabels.map((label) => <li key={label}>{label}</li>)}
          </ul>
        </aside>

        <aside className="stats-page__optimizer-col">
          <OptimizerPanel
            echoes={echoes}
            validLabels={validLabels}
            raw={aggregate}
            baseStats={baseStats}
            weaponData={weaponData}
            onResultsChange={setOptimizerResults}
            onFocusEcho={focusEcho}
          />
        </aside>

        <aside className="stats-page__aggregate-col">
          <h4 className="stats-page__col-title">합산 스탯</h4>
          <table className="full-aggregate-table">
            <thead>
              <tr>
                <th>스탯</th>
                <th>합산</th>
                <th>내역</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER.map((cat) => {
                const raw = aggregate[cat]
                if (BASE_TOTAL_CATEGORIES.has(cat)) {
                  const calc = computeCategoryTotal(cat, raw, baseStats, weaponData)
                  const isWholeStat = BASE_ONLY_CATEGORIES.has(cat) // HP·공격력·방어력만 정수
                  const isPercentCat = !isWholeStat
                  const fmt = (n) => (isWholeStat ? formatWholeStat(cat, n) : formatPercent1(n))
                  return (
                    <tr key={cat}>
                      <td className="full-aggregate-table__label">{cat}</td>
                      <td className="full-aggregate-table__total">
                        {fmt(calc.total)}{isPercentCat ? '%' : ''}
                      </td>
                      <td className="full-aggregate-table__values">
                        <span className="stat-base">{fmt(calc.base)}</span>
                        {' + '}
                        <span className="stat-additional">{fmt(calc.additional)}</span>
                      </td>
                    </tr>
                  )
                }
                const display = raw.percentSum ? `${formatPercent1(raw.percentSum)}%` : '-'
                return (
                  <tr key={cat}>
                    <td className="full-aggregate-table__label">{cat}</td>
                    <td className="full-aggregate-table__values" colSpan={2}>
                      {display === '-' ? <span className="full-aggregate-table__empty">-</span> : display}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!baseStats && (
            <p className="optimizer__estimate">
              이 캐릭터는 기초 스탯 데이터가 없어서 "합산"이 0으로 나와요. 알려주시면 추가해드릴게요.
            </p>
          )}
        </aside>
      </div>

      <WeaponPickerModal
        open={weaponModalOpen}
        onClose={() => setWeaponModalOpen(false)}
        onSelect={(id) => { onSetWeapon(id); setWeaponModalOpen(false) }}
        weaponType={character?.weaponType}
      />
      <EchoSetPickerModal
        open={setModalOpen}
        onClose={() => setSetModalOpen(false)}
        remainingPieces={5 - totalEchoSetPieces}
        onSelect={(id, pieceCount) => {
          if (totalEchoSetPieces + pieceCount > 5) return
          onSetEchoSets([...echoSets, { setId: id, pieceCount }])
          setSetModalOpen(false)
        }}
      />
      <ConfirmDialog
        open={resetOpen}
        title="초기화"
        message="누르게 되면 이 캐릭터의 에코 데이터가 초기화되고, 캡처 화면으로 이동합니다."
        confirmLabel="예"
        cancelLabel="아니요"
        onConfirm={() => { setResetOpen(false); onReset() }}
        onCancel={() => setResetOpen(false)}
      />
    </section>
  )
}
