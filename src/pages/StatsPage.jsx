import { useEffect, useRef, useState } from 'react'
import { getValidOptions } from '../config/characterValidOptions'
import { getCharacterBaseStats } from '../config/characterBaseStats'
import { WEAPONS, getWeapon } from '../config/weapons'
import { ECHO_SETS, getEchoSet } from '../config/echoSets'
import { getAllowedEchoSetIds } from '../config/characterEchoSets'
import { getCharacterRecommendation } from '../config/characterRecommendations'
import { getMainEcho, getMainEchoForSet } from '../config/mainEchoes'
import { getMainEchoDamageBonus } from '../config/characterMainEchoBonus'
import { SUB_STAT_OPTIONS } from '../config/subStatOptions'
import { getEchoCost } from '../utils/ocr'
import { runOptimizerFromGap, OPTIMIZER_CATEGORIES, findReallocationCandidate } from '../utils/optimizer'
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
const OPTIMIZER_TARGET_ORDER = ['HP', '공격력', '방어력', '크리티컬', '공명 효율', '크리티컬 피해']

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

// HP·공격력·방어력 전부 소수점을 무조건 버림(내림) 처리해서 정수로 표시합니다.
const formatWholeStat = (n) => Math.floor(n)
// 그 외 전부(공명 효율·크리티컬·크리티컬 피해 포함)는 항상 소수점 한 자리까지 표기 (예: 1.0%)
const formatPercent1 = (n) => n.toFixed(1)

/**
 * 캐릭터 고유 보너스 + 무기 + 에코 세트(2세트 효과만) + 캡처된 에코(메인+서브)를 전부 더해서
 * 카테고리별 %합계/플랫합계를 냅니다. 5세트 효과는 계산에 반영하지 않고 안내 문구로만 보여줍니다.
 * 에코 세트는 캐릭터당 하나만 고르는 select라 항상 풀세트(5개)로 착용했다고 가정합니다.
 */
function computeAggregate({ echoes, character, weaponId, echoSetId }) {
  const raw = {}
  for (const cat of CATEGORY_ORDER) raw[cat] = { percentSum: 0, flatSum: 0, echoPercentSum: 0, echoFlatSum: 0 }
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

  const echoSet = getEchoSet(echoSetId)
  const twoPiece = echoSet?.pieces?.[2]
  if (twoPiece) {
    for (const b of twoPiece.bonuses ?? []) addPercent(b.category, b.value)
  }

  for (const echo of echoes) {
    for (const s of [...echo.mainStats, ...echo.subStats]) {
      if (!s.label || !s.valueText) continue
      const cat = matchCategory(s.label)
      if (!cat) continue
      const num = parseFloat(s.valueText)
      if (Number.isNaN(num)) continue
      if (s.valueText.includes('%')) {
        raw[cat].percentSum += num
        raw[cat].echoPercentSum += num
      } else {
        raw[cat].flatSum += num
        raw[cat].echoFlatSum += num
      }
    }
  }

  return { raw, baseStats, weapon }
}

/** 카테고리별 "기준(캐릭터+무기) / 합산 총합 / 추가분" 을 계산합니다. */
function computeCategoryTotal(cat, raw, baseStats, weapon) {
  switch (cat) {
    case 'HP': {
      const base = baseStats?.hp ?? 0
      // 게임 내 HP는 에코 5장분 합산에서 절사 오차로 실제 값보다 1 낮게 나옵니다(캐릭터/무기/세트
      // 보너스 쪽은 이 오차가 없어서, 에코에서 나온 몫만 따로 떼어 -1을 적용합니다).
      const nonEchoPercent = raw.percentSum - raw.echoPercentSum
      const nonEchoFlat = raw.flatSum - raw.echoFlatSum
      const nonEchoAdditional = base * (nonEchoPercent / 100) + nonEchoFlat
      const echoRaw = base * (raw.echoPercentSum / 100) + raw.echoFlatSum
      const echoAdditional = raw.echoPercentSum || raw.echoFlatSum ? Math.max(0, Math.floor(echoRaw) - 1) : 0
      const total = base + nonEchoAdditional + echoAdditional
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

function WeaponPickerModal({ open, onClose, onSelect, options }) {
  return (
    <Modal open={open} title="무기 선택" onClose={onClose}>
      {options.length === 0 && <p className="uploader__hint">이 캐릭터가 쓸 수 있는 무기가 카탈로그에 없어요.</p>}
      {options.map(([id, w]) => (
        <button key={id} className="picker-item picker-item--simple" onClick={() => onSelect(id)}>
          {w.icon && <img src={w.icon} alt={w.name} className="picker-item__icon" />}
          <span>{w.name}</span>
        </button>
      ))}
    </Modal>
  )
}

function EchoSetPickerModal({ open, onClose, onSelect, options }) {
  return (
    <Modal open={open} title="에코 세트 선택" onClose={onClose}>
      {options.length === 0 && <p className="uploader__hint">이 캐릭터가 쓸 수 있는 에코 세트가 카탈로그에 없어요.</p>}
      {options.map(([id, set]) => (
        <button key={id} className="picker-item picker-item--simple" onClick={() => onSelect(id)}>
          {set.icon && <img src={set.icon} alt={set.name} className="picker-item__icon" />}
          <span>{set.name}</span>
        </button>
      ))}
    </Modal>
  )
}

const BASE_ONLY_CATEGORIES = new Set(['HP', '공격력', '방어력'])

// 스텝을 클릭했을 때 깜빡여줄 자리(라벨+수치)입니다. 'add'는 아직 없던 자리라 깜빡일 대상이 없습니다.
function blinkTargetForStep(s) {
  if (s.action === 'replace') return { label: s.fromLabel, value: s.fromValue }
  if (s.action === 'upgrade') return { label: s.label, value: s.fromValue }
  return null
}

// 카드 안에 짧게 보여줄 변경 내용입니다. 에코/코스트/교체 버튼은 카드 헤더에 이미 있어서 여기선 뺍니다.
// "- 이전 값" / "→ 이후 값" 두 줄로 보여줍니다. add는 이전 값이 없어서 한 줄만 씁니다.
function describeStepParts(s) {
  if (s.action === 'add') return { single: `${s.label} ${s.toValue} 추가` }
  if (s.action === 'replace') return { from: `${s.fromLabel} ${s.fromValue}`, to: `${s.label} ${s.toValue} 교체` }
  return { from: `${s.label} ${s.fromValue}`, to: `${s.toValue} 교체` }
}

/**
 * 이 변경을 실제로 적용하면 그 카테고리의 합산이 얼마가 될지 미리 계산합니다(적용은 안 함, 표시
 * 전용). gainIsFlat이면 gain을 그대로 더하고(플랫은 기준값 곱셈 없이 직접 더해짐), 아니면
 * 퍼센트로 취급해 isWholeStat 카테고리는 기준값(base)에 곱해서 더합니다.
 */
function projectGain(result, gain, isWholeStat, gainIsFlat) {
  if (!result) return null
  if (gainIsFlat) return result.currentTotal + gain
  return isWholeStat ? result.currentTotal + (gain / 100) * result.base : result.currentTotal + gain
}

function OptimizerPanel({
  echoes,
  validLabels,
  raw,
  baseStats,
  weaponData,
  onResultsChange,
  onFocusEcho,
  onUpdateSubStats,
}) {
  const [targets, setTargets] = useState({})
  const [ran, setRan] = useState(false)
  const [results, setResults] = useState({})
  const [checkedKey, setCheckedKey] = useState(null) // 방금 [확인]을 누른 카드 — 그동안만 파란 테두리
  const checkedTimeoutRef = useRef(null)

  useEffect(() => () => {
    if (checkedTimeoutRef.current) clearTimeout(checkedTimeoutRef.current)
  }, [])

  // [확인]을 누르면 그 에코로 포커스 이동 + 깜빡임을 실행하고, 같은 시간 동안만 카드에 파란
  // 테두리를 켭니다(기본은 테두리 없음). 깜빡임이 끝나는 시점(1200ms)에 맞춰 같이 꺼집니다.
  const handleCheck = (key, echoIndex, blinkTarget) => {
    onFocusEcho?.(echoIndex, blinkTarget)
    setCheckedKey(key)
    if (checkedTimeoutRef.current) clearTimeout(checkedTimeoutRef.current)
    checkedTimeoutRef.current = setTimeout(() => setCheckedKey(null), 1200)
  }

  // [교체] 버튼을 눌렀을 때만 실제로 값을 바꿉니다 — 카드 자체나 헤더를 눌러선 적용되지 않습니다.
  const applyStep = (s) => {
    const echo = echoes[s.echoIndex]
    if (!echo) return
    let statId
    if (s.action === 'add') {
      // "스탯 선택"만 해두고 값을 안 고른 자리, 또는 완전히 빈 자리가 있으면 새로 만들지 않고 그걸 채웁니다.
      const reusable =
        echo.subStats.find((sub) => sub.label === s.label && !sub.valueText) ??
        echo.subStats.find((sub) => !sub.label)
      if (reusable) {
        statId = reusable.id
        onUpdateSubStats(
          echo.id,
          echo.subStats.map((sub) => (sub.id === reusable.id ? { ...sub, label: s.label, valueText: s.toValue } : sub)),
        )
      } else {
        if (echo.subStats.length >= 5) return
        statId = `stat-${Date.now()}`
        onUpdateSubStats(echo.id, [...echo.subStats, { id: statId, label: s.label, valueText: s.toValue }])
      }
    } else if (s.action === 'replace') {
      const target = echo.subStats.find((sub) => sub.label === s.fromLabel && sub.valueText === s.fromValue)
      if (!target) return
      statId = target.id
      onUpdateSubStats(
        echo.id,
        echo.subStats.map((sub) => (sub.id === target.id ? { ...sub, label: s.label, valueText: s.toValue } : sub)),
      )
    } else if (s.action === 'upgrade') {
      const target = echo.subStats.find((sub) => sub.label === s.label && sub.valueText === s.fromValue)
      if (!target) return
      statId = target.id
      onUpdateSubStats(echo.id, echo.subStats.map((sub) => (sub.id === target.id ? { ...sub, valueText: s.toValue } : sub)))
    }
    onFocusEcho?.(s.echoIndex, { label: s.label, value: s.toValue })
  }

  const applyReallocation = (reloc) => {
    const echo = echoes[reloc.echoIndex]
    if (!echo) return
    const target = echo.subStats.find((sub) => sub.label === reloc.fromLabel && sub.valueText === reloc.fromValue)
    if (!target) return
    onUpdateSubStats(
      echo.id,
      echo.subStats.map((sub) => (sub.id === target.id ? { ...sub, label: reloc.toLabel, valueText: reloc.toValue } : sub)),
    )
    onFocusEcho?.(reloc.echoIndex, { label: reloc.toLabel, value: reloc.toValue })
  }

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
      out[cat] = { ...r, currentTotal: calc.total, base: calc.base, margin: calc.total - t }
    }
    // 어떤 목표를 이미 여유 있게 달성했는데 다른 목표는 아직 부족하다면, 옵션을 옮길 수도 있다고 안내.
    // 가능하면 "어느 에코의 어떤 옵션을 빼서 어디로 옮기면 되는지"까지 구체적으로 짚어줍니다.
    const shortEntries = Object.entries(out).filter(([, r]) => !r.achieved)
    const anyShort = shortEntries.length > 0
    for (const [cat, r] of Object.entries(out)) {
      r.showReallocateHint = r.achieved && anyShort && r.margin > 0
      if (!r.showReallocateHint) continue

      const info = OPTIMIZER_CATEGORIES[cat]
      if (!info) continue
      // 기준값 곱셈형 카테고리(HP·공격력·방어력)의 여유분은 "그 스탯의 절대값" 단위라서, 재배치
      // 후보를 찾으려면 서브스탯과 같은 % 단위로 환산해야 합니다.
      const marginBudget = BASE_ONLY_CATEGORIES.has(cat)
        ? (r.base > 0 ? (r.margin / r.base) * 100 : 0)
        : r.margin
      const candidate = findReallocationCandidate(info.percentLabel, marginBudget, echoes)
      if (!candidate) continue

      // 부족분(neededPercentTotal)이 가장 큰 목표를 우선으로 옮겨줍니다.
      const targetCat = shortEntries
        .map(([c, tr]) => ({ c, need: tr.neededPercentTotal ?? 0 }))
        .sort((a, b) => b.need - a.need)[0]?.c
      const targetInfo = targetCat ? OPTIMIZER_CATEGORIES[targetCat] : null
      if (!targetInfo) continue
      const targetOptions = SUB_STAT_OPTIONS[targetInfo.percentLabel] ?? []
      const targetMaxTier = targetOptions.length ? targetOptions[targetOptions.length - 1] : null
      if (targetMaxTier == null) continue

      r.reallocation = {
        echoIndex: candidate.echoIndex,
        fromCategory: cat,
        fromLabel: info.percentLabel,
        fromValue: candidate.valueText,
        toCategory: targetCat,
        toLabel: targetInfo.percentLabel,
        toValue: `${targetMaxTier}%`,
        altFlatLabel: targetInfo.flatLabel ?? null,
      }
    }
    setResults(out)
    setRan(true)
    onResultsChange?.(out)
  }

  // 서브스탯을 직접 고치면(에코 편집 패널에서) 이미 계산해본 적이 있을 때만 자동으로 다시 계산해서,
  // 방금 바꾼 결과가 곧바로 반영된 "남은 퍼센트"를 보여줍니다.
  useEffect(() => {
    if (!ran) return
    handleCalculate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echoes])

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
            const isWholeStat = BASE_ONLY_CATEGORIES.has(cat)
            const fmtVal = (n) => (isWholeStat ? formatWholeStat(n) : formatPercent1(n))
            const unitStr = isWholeStat ? '' : '%'
            return (
              <div className="optimizer__result" key={cat}>
                <p className="optimizer__result-title">{cat}</p>
                <p>
                  현재 약 <strong>{fmtVal(r.currentTotal)}{unitStr}</strong> ·{' '}
                  {r.achieved ? (
                    '점수를 달성했어요!'
                  ) : (
                    <>남은 <strong>{fmtVal(-r.margin)}{unitStr}</strong></>
                  )}
                </p>
                {r.achieved ? (
                  r.showReallocateHint &&
                  r.reallocation && (
                    <div className={`optimizer__step-card ${checkedKey === `realloc-${cat}` ? 'optimizer__step-card--checked' : ''}`}>
                      <div className="optimizer__step-head-row">
                        <button
                          className="optimizer__step-header"
                          onClick={() => onFocusEcho?.(r.reallocation.echoIndex)}
                        >
                          에코 {r.reallocation.echoIndex + 1}
                          {getEchoCost(echoes[r.reallocation.echoIndex]) && (
                            <span className="stats-page__chip-cost">COST {getEchoCost(echoes[r.reallocation.echoIndex])}</span>
                          )}
                        </button>
                        <button
                          className="optimizer__check-btn"
                          onClick={() => handleCheck(`realloc-${cat}`, r.reallocation.echoIndex, { label: r.reallocation.fromLabel, value: r.reallocation.fromValue })}
                        >
                          확인
                        </button>
                        <button className="optimizer__apply-btn" onClick={() => applyReallocation(r.reallocation)}>
                          교체
                        </button>
                      </div>
                      <p className="optimizer__step-desc">
                        - {r.reallocation.fromLabel} {r.reallocation.fromValue}
                        <br />
                        → {r.reallocation.toLabel} {r.reallocation.toValue} 교체
                      </p>
                      {(() => {
                        const targetResult = results[r.reallocation.toCategory]
                        const targetIsWhole = BASE_ONLY_CATEGORIES.has(r.reallocation.toCategory)
                        const targetGain = parseFloat(r.reallocation.toValue)
                        const projected = projectGain(targetResult, targetGain, targetIsWhole)
                        const targetFmt = (n) => (targetIsWhole ? formatWholeStat(n) : formatPercent1(n))
                        const targetUnit = targetIsWhole ? '' : '%'
                        return projected != null ? (
                          <p className="optimizer__estimate">
                            - 현재 기준으로 {r.reallocation.toCategory}이(가){' '}
                            <strong>{targetFmt(projected)}{targetUnit}</strong> 가 됩니다.
                          </p>
                        ) : null
                      })()}
                      {r.reallocation.altFlatLabel && (
                        <p className="optimizer__estimate optimizer__alt">
                          또는 플랫 {r.reallocation.altFlatLabel}로 바꿔도 도움이 돼요.
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  <>
                    {r.steps?.length === 0 ? (
                      <p className="optimizer__estimate">추천할 자리가 없어요 (자리 부족 또는 이미 최고 단계).</p>
                    ) : (
                      <ul className="optimizer__steps">
                        {r.steps?.map((s, i) => {
                          const projected = projectGain(r, s.gain, isWholeStat, s.gainIsFlat)
                          const stepKey = `step-${cat}-${i}`
                          return (
                            <li key={i} className={`optimizer__step-card ${checkedKey === stepKey ? 'optimizer__step-card--checked' : ''}`}>
                              <div className="optimizer__step-head-row">
                                <button className="optimizer__step-header" onClick={() => onFocusEcho?.(s.echoIndex, blinkTargetForStep(s))}>
                                  에코 {s.echoIndex + 1}
                                  {getEchoCost(echoes[s.echoIndex]) && (
                                    <span className="stats-page__chip-cost">COST {getEchoCost(echoes[s.echoIndex])}</span>
                                  )}
                                </button>
                                <button
                                  className="optimizer__check-btn"
                                  onClick={() => handleCheck(stepKey, s.echoIndex, blinkTargetForStep(s))}
                                >
                                  확인
                                </button>
                                <button className="optimizer__apply-btn" onClick={() => applyStep(s)}>
                                  교체
                                </button>
                              </div>
                              {(() => {
                                const parts = describeStepParts(s)
                                return (
                                  <p className="optimizer__step-desc">
                                    {parts.single ? (
                                      <>+ {parts.single}</>
                                    ) : (
                                      <>
                                        - {parts.from}
                                        <br />
                                        → {parts.to}
                                      </>
                                    )}
                                  </p>
                                )
                              })()}
                              {projected != null && (
                                <p className="optimizer__estimate">
                                  - 현재 기준으로 {cat}이(가) <strong>{fmtVal(projected)}{unitStr}</strong> 가 됩니다.
                                </p>
                              )}
                              {s.alt && (
                                <p className="optimizer__estimate optimizer__alt">
                                  또는 {s.alt.label} {s.alt.value}로 채워도 도움이 돼요.
                                </p>
                              )}
                            </li>
                          )
                        })}
                      </ul>
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
  echoSetId,
  onSetWeapon,
  onSetEchoSet,
  onUpdateSubStats,
  onGoToCharacters,
  onReset,
}) {
  const [resetOpen, setResetOpen] = useState(false)
  const [weaponModalOpen, setWeaponModalOpen] = useState(false)
  const [setModalOpen, setSetModalOpen] = useState(false)
  const [selectedEchoIdx, setSelectedEchoIdx] = useState(0)
  const [optimizerResults, setOptimizerResults] = useState({})
  const [blink, setBlink] = useState(null) // { echoIndex, label, value, token } — 방금 클릭한 추천의 위치
  const echoEditorRef = useRef(null)
  const blinkTimeoutRef = useRef(null)
  const aggregateColRef = useRef(null)
  const [aggregateColHeight, setAggregateColHeight] = useState(null)
  const validLabels = getValidOptions(character?.id)
  const recommendation = getCharacterRecommendation(character?.id)
  // 메인 에코는 별도로 고르지 않고, 지금 고른 에코 세트에 연결된 걸 항상 그대로 씁니다.
  const mainEchoId = getMainEchoForSet(echoSetId)
  const mainEcho = getMainEcho(mainEchoId)

  // 캐릭터의 무기 타입에 맞는 무기로만 제한합니다(타입 미지정 캐릭터는 카탈로그 전체 허용).
  const weaponOptions = Object.entries(WEAPONS).filter(
    ([, w]) => !character?.weaponType || w.type === character.weaponType,
  )
  // 캐릭터가 실제로 쓸 수 있는 에코 세트로 제한합니다(설정 없으면 카탈로그 전체 허용).
  const allowedEchoSetIds = getAllowedEchoSetIds(character?.id)
  const echoSetOptions = Object.entries(ECHO_SETS).filter(
    ([id]) => !allowedEchoSetIds || allowedEchoSetIds.includes(id),
  )

  // scroll: 계산기 추천처럼 화면 아래쪽에서 눌렀을 때만 위로 스크롤합니다. 에코 점수 목록은 이미
  // 에코 편집 패널 바로 옆이라 스크롤이 필요 없고, 오히려 원하지 않는 화면 흔들림이었습니다.
  const focusEcho = (idx, blinkTarget, scroll = true) => {
    setSelectedEchoIdx(idx)
    if (scroll) {
      // 편집 패널이 열리는(=DOM에 그려지는) 다음 프레임에 스크롤해야 실제로 보이는 위치까지 이동합니다.
      requestAnimationFrame(() => {
        echoEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
    if (!blinkTarget) return
    setBlink({ echoIndex: idx, label: blinkTarget.label, value: blinkTarget.value, token: Date.now() })
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current)
    blinkTimeoutRef.current = setTimeout(() => setBlink(null), 1200)
  }

  useEffect(() => () => {
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current)
  }, [])

  // 에코 상세 설정(에코 선택 + 편집 패널)이 항상 합산 스탯 카드와 같은 높이가 되도록, 합산 스탯의
  // 실제 렌더 높이를 재서 그대로 최소 높이로 씁니다. 둘은 서로 다른 행에 있어 CSS만으로는 높이를
  // 맞출 수 없어 여기서만 측정합니다(스크롤과는 무관하게 내용이 바뀔 때만 다시 잽니다).
  useEffect(() => {
    const node = aggregateColRef.current
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect?.height
      if (height) setAggregateColHeight(height)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // 각 항목은 "추천이 나온 시점의 상태"(라벨+수치)를 담고 있어서, 사용자가 그 자리를 조금이라도
  // 바꾸면 더 이상 일치하지 않아 하늘색 표시가 자동으로 풀립니다.
  const suggestedStatsForSelected = []
  Object.values(optimizerResults).forEach((r) => {
    r?.steps?.forEach((s) => {
      if (s.echoIndex !== selectedEchoIdx) return
      if (s.action === 'replace') suggestedStatsForSelected.push({ label: s.fromLabel, value: s.fromValue })
      else if (s.action === 'upgrade') suggestedStatsForSelected.push({ label: s.label, value: s.fromValue })
    })
    if (r?.reallocation && r.reallocation.echoIndex === selectedEchoIdx) {
      suggestedStatsForSelected.push({ label: r.reallocation.fromLabel, value: r.reallocation.fromValue })
    }
  })

  const { raw: aggregate, baseStats, weapon: weaponData } = computeAggregate({
    echoes,
    character,
    weaponId: weapon,
    echoSetId,
  })
  const echoSetData = getEchoSet(echoSetId)

  // 메인 에코 데미지 보너스 계산식이 참고할 수 있는 최종 합산 전투 스탯입니다.
  const combatStats = {
    atk: computeCategoryTotal('공격력', aggregate['공격력'], baseStats, weaponData)?.total ?? 0,
    def: computeCategoryTotal('방어력', aggregate['방어력'], baseStats, weaponData)?.total ?? 0,
    hp: computeCategoryTotal('HP', aggregate['HP'], baseStats, weaponData)?.total ?? 0,
    critRate: computeCategoryTotal('크리티컬', aggregate['크리티컬'], baseStats, weaponData)?.total ?? 0,
    critDmg: computeCategoryTotal('크리티컬 피해', aggregate['크리티컬 피해'], baseStats, weaponData)?.total ?? 0,
  }
  const mainEchoDamageBonus = getMainEchoDamageBonus(character?.id, mainEchoId, combatStats)

  return (
    <section className="stats-page">
      <div className="stats-page__layout">
      <div className="stats-page__main">
      <header className="stats-page__head">
        <div className="stats-page__head-top">
          <span className="uploader__eyebrow">점수 통계</span>
        </div>
        <h2>캐릭터의 유효 옵션 기준으로 서브 스탯을 확인합니다</h2>
        <p className="uploader__hint">여기서 바로 스탯을 수정할 수 있어요. 노란색 항목만 유효 옵션입니다.</p>
      </header>

      <div className="stats-page__columns">
        <div className="stats-page__char-loadout">
        <aside className="stats-page__char">
          {character?.image ? (
            <img className="stats-page__char-photo" src={character.image} alt={character.name} />
          ) : (
            <div className="stats-page__char-photo stats-page__char-photo--fallback" style={{ background: character?.color }}>
              {character?.initials}
            </div>
          )}
          <h3>{character?.name ?? '캐릭터 미선택'}</h3>
          {character?.element && <p className="stats-page__char-element">{character.element}</p>}

          <h4>유효 옵션</h4>
          <ul className="stats-page__valid-list">
            {validLabels.length === 0 && <li className="echo-panel__empty">설정된 유효 옵션 없음</li>}
            {validLabels.map((label) => <li key={label}>{label}</li>)}
          </ul>
        </aside>

        <aside className="stats-page__loadout">
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
          {echoSetData ? (
            <div className="stats-page__chip-card">
              <button className="stats-page__chip-head stats-page__chip-head--btn" onClick={() => setSetModalOpen(true)}>
                {echoSetData.icon && <img src={echoSetData.icon} alt={echoSetData.name} />}
                <span>{echoSetData.name}</span>
              </button>
              {Object.entries(echoSetData.pieces ?? {})
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([n, effect]) => (
                  <p key={n} className="stats-page__chip-effect">
                    {n}세트: {effect.description}
                  </p>
                ))}
            </div>
          ) : (
            <button className="btn btn--ghost stats-page__pick-btn" onClick={() => setSetModalOpen(true)}>
              + 에코 세트 선택
            </button>
          )}

          <h4>사용 메인 에코</h4>
          {mainEcho ? (
            <div className="stats-page__chip-card">
              <div className="stats-page__chip-head">
                {mainEcho.icon && <img src={mainEcho.icon} alt={mainEcho.name} />}
                <span>{mainEcho.name}</span>
              </div>
              {mainEchoDamageBonus != null && (
                <p className="stats-page__chip-effect">데미지 보너스: +{formatPercent1(mainEchoDamageBonus)}%</p>
              )}
            </div>
          ) : (
            <p className="uploader__hint">고른 에코 세트에 연결된 메인 에코가 아직 없어요.</p>
          )}
        </aside>
        </div>

        <aside className="stats-page__aggregate-col" ref={aggregateColRef}>
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
                  const fmt = (n) => (isWholeStat ? formatWholeStat(n) : formatPercent1(n))
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
          <p className="stats-page__aggregate-note">※ 제작자 추천 내용입니다. 게임 내 실제 값과 다를 수 있어요.</p>

          <div className="stats-page__recommend">
            <h4 className="stats-page__col-title">제작자 추천</h4>
            {recommendation ? (
              <>
                <ul className="stats-page__recommend-list">
                  <li><span>추천 무기</span><strong>{recommendation.weapon ?? '-'}</strong></li>
                  <li><span>에코 세트</span><strong>{recommendation.echoSet ?? '-'}</strong></li>
                  <li><span>에코 주옵</span><strong>{recommendation.echoMainStat ?? '-'}</strong></li>
                  <li><span>크확크피</span><strong>{recommendation.critRatio ?? '-'}</strong></li>
                  <li><span>공명 효율</span><strong>{recommendation.resonanceEfficiency ?? '-'}</strong></li>
                  <li><span>공격력</span><strong>{recommendation.atk ?? '-'}</strong></li>
                  <li><span>공명 에너지 소모</span><strong>{recommendation.energyCost ?? '-'}</strong></li>
                </ul>
                {recommendation.notes?.length > 0 && (
                  <div className="stats-page__recommend-notes">
                    <h5>참고사항</h5>
                    <ul>
                      {recommendation.notes.map((note, i) => <li key={i}>{note}</li>)}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="uploader__hint">아직 이 캐릭터의 추천 정보가 없어요. 알려주시면 채워드릴게요.</p>
            )}
          </div>
        </aside>
      </div>

      <div className="echo-editor-wrap" ref={echoEditorRef}>
        <h4 className="echo-editor__title">에코 상세 설정</h4>

        <div className="echo-editor">
            <div className="echo-editor__scores">
              <h4 className="stats-page__col-title">에코 선택</h4>
              {echoes.length === 0 ? (
                <p className="uploader__hint">등록된 에코가 없어요.</p>
              ) : (
                <ul className="stats-page__chip-list">
                  {echoes.map((echo, i) => (
                    <li key={echo.id}>
                      <button
                        className={`stats-page__chip-card stats-page__chip-head--btn ${selectedEchoIdx === i ? 'stats-page__chip-card--active' : ''}`}
                        onClick={() => focusEcho(i, null, false)}
                      >
                        <div className="stats-page__chip-head">
                          <span>에코 {i + 1}</span>
                          {getEchoCost(echo) && <span className="stats-page__chip-cost">COST {getEchoCost(echo)}</span>}
                          <span className="stats-page__chip-arrow" aria-hidden="true">›</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="echo-editor__panel">
              {echoes[selectedEchoIdx] && (
                <EchoPanel
                  echo={echoes[selectedEchoIdx]}
                  index={selectedEchoIdx}
                  onUpdateSubStats={onUpdateSubStats}
                  validLabels={validLabels}
                  suggestedStats={suggestedStatsForSelected}
                  blinkLabel={blink?.echoIndex === selectedEchoIdx ? blink.label : null}
                  blinkValue={blink?.echoIndex === selectedEchoIdx ? blink.value : null}
                  blinkToken={blink?.token}
                />
              )}
            </div>
        </div>
      </div>
      </div>

      <div className="stats-page__optimizer-wrap">
        <div className="stats-page__head-actions">
          <button className="capture-page__back" onClick={() => setResetOpen(true)}>초기화</button>
          <button className="capture-page__back" onClick={onGoToCharacters}>← 캐릭터 선택으로</button>
        </div>
        <header className="stats-page__head stats-page__head--spacer" aria-hidden="true">
          <div className="stats-page__head-top">
            <span className="uploader__eyebrow">점수 통계</span>
          </div>
          <h2>캐릭터의 유효 옵션 기준으로 서브 스탯을 확인합니다</h2>
          <p className="uploader__hint">여기서 바로 스탯을 수정할 수 있어요. 노란색 항목만 유효 옵션입니다.</p>
        </header>
        <aside className="stats-page__optimizer-col">
          <OptimizerPanel
            echoes={echoes}
            validLabels={validLabels}
            raw={aggregate}
            baseStats={baseStats}
            weaponData={weaponData}
            onResultsChange={setOptimizerResults}
            onFocusEcho={focusEcho}
            onUpdateSubStats={onUpdateSubStats}
          />
        </aside>
      </div>
      </div>

      <WeaponPickerModal
        open={weaponModalOpen}
        onClose={() => setWeaponModalOpen(false)}
        onSelect={(id) => { onSetWeapon(id); setWeaponModalOpen(false) }}
        options={weaponOptions}
      />
      <EchoSetPickerModal
        open={setModalOpen}
        onClose={() => setSetModalOpen(false)}
        onSelect={(id) => { onSetEchoSet(id); setSetModalOpen(false) }}
        options={echoSetOptions}
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
