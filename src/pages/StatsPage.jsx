import { useEffect, useLayoutEffect, useRef, useState, Fragment } from 'react'
import { ELEMENT_COLORS } from '../config/characters'
import { getValidOptions } from '../config/characterValidOptions'
import { getCharacterBaseStats } from '../config/characterBaseStats'
import { WEAPONS, getWeapon } from '../config/weapons'
import { WEAPON_RANKS, hasRankValues, weaponBonusesAt, weaponDescriptionAt } from '../utils/weaponRank'
import { getCharacterWeaponIds } from '../config/characterWeapons'
import { ECHO_SETS, getEchoSet } from '../config/echoSets'
import { getCharacterEchoCombos } from '../config/characterEchoSets'
import { getMainEcho } from '../config/mainEchoes'
import { getMainEchoIdsForCombo } from '../config/echoSetMainEchoes'
import { getMainEchoDamageBonus } from '../config/characterMainEchoBonus'
import { SUB_STAT_NAMES } from '../config/subStatOptions'
import { getEchoCost } from '../utils/ocr'
import { OPTIMIZER_CATEGORIES } from '../utils/optimizer'
import { startMission } from '../utils/enhanceMission'
import { planJoint } from '../utils/jointOptimizer'
import ConfirmDialog from '../components/ConfirmDialog'
import EchoPanel from '../components/EchoPanel'
import MobileSection from '../components/MobileSection'
import Modal from '../components/Modal'
import RetakeModal from '../components/RetakeModal'
import EchoScoreCard from '../components/EchoScoreCard'
import EchoOddsCard from '../components/EchoOddsCard'
import './StatsPage.css'

const ELEMENT_DAMAGE_LABELS = ['응결 피해 보너스', '용융 피해 보너스', '전도 피해 보너스', '기류 피해 보너스', '회절 피해 보너스', '인멸 피해 보너스']

// 합산 스탯에 보여줄 카테고리와, 우리 카탈로그 라벨(메인/서브 공통, % 유무 무관)과의 매칭입니다.
// 에코 피해는 맨 아래로. 속성 피해 보너스는 캐릭터의 속성에 맞는 것만 보여줍니다(예: 기류
// 캐릭터면 "기류 피해 보너스"만 집계 — 다른 속성 보너스가 섞여 있어도 무시됨). "전체 속성 피해
// 보너스"처럼 속성 무관 범용 문구('속성 피해 보너스')는 어떤 캐릭터든 항상 포함됩니다. 캐릭터가
// 없거나 속성을 모르면 예전처럼 6개 속성을 전부 합쳐서 보여줍니다.
function getCategoryBaseNames(element) {
  const elementalKey = element ? `${element} 피해 보너스` : '속성 피해 보너스'
  return {
    HP: ['HP'],
    공격력: ['공격력'],
    방어력: ['방어력'],
    '공명 효율': ['공명 효율'],
    크리티컬: ['크리티컬'],
    '크리티컬 피해': ['크리티컬 피해'],
    [elementalKey]: element ? ['속성 피해 보너스', elementalKey] : ['속성 피해 보너스', '물리 피해 보너스', ...ELEMENT_DAMAGE_LABELS],
    '일반 공격 피해': ['일반 공격 피해', '일반 공격 피해 보너스'],
    '강공격 피해': ['강공격 피해', '강공격 피해 보너스'],
    '공명 스킬 피해': ['공명 스킬 피해', '공명 스킬 피해 보너스'],
    '공명 해방 피해': ['공명 해방 피해', '공명 해방 피해 보너스'],
    '에코 피해': ['에코 피해'],
    // 치료 효과 보너스: 4코 메인 옵션·에코·세트 효과에서 붙습니다(힐러용).
    '치료 효과 보너스': ['치료 효과 보너스', '치료 효과'],
  }
}
const BASE_TOTAL_CATEGORIES = new Set(['HP', '공격력', '방어력', '공명 효율', '크리티컬', '크리티컬 피해'])
// 목표 스탯 계산기에 넣을 수 있는 스탯: 에코 서브 옵션으로 챙길 수 있는 것 전부(속성 피해·에코 피해는 서브 옵션에 없어서 제외)
const OPTIMIZER_TARGET_ORDER = ['HP', '공격력', '방어력', '크리티컬', '크리티컬 피해', '공명 효율', '일반 공격 피해', '강공격 피해', '공명 스킬 피해', '공명 해방 피해']

// 에코 5개의 코스트 합계 한도입니다.
const MAX_TOTAL_COST = 12

function stripPercent(label) {
  return label.endsWith('%') ? label.slice(0, -1) : label
}

function matchCategory(label, categoryBaseNames) {
  const base = stripPercent(label)
  for (const [cat, names] of Object.entries(categoryBaseNames)) {
    if (names.includes(base)) return cat
  }
  return null
}

// HP·공격력·방어력 전부 소수점을 무조건 버림(내림) 처리해서 정수로 표시합니다.
const formatWholeStat = (n) => Math.floor(n)
// 그 외 전부(공명 효율·크리티컬·크리티컬 피해 포함)는 항상 소수점 한 자리까지 표기 (예: 1.0%)
const formatPercent1 = (n) => n.toFixed(1)

/**
 * 캐릭터 고유 보너스 + 무기 + 에코 세트 조합(착용 개수 이하 단계 전부) + 메인 에코 장착 보너스 +
 * 캡처된 에코(메인+서브)를 전부 더해서 카테고리별 %합계/플랫합계를 냅니다. 조건부 효과(bonuses가
 * 없는 단계)는 계산에 반영하지 않고 안내 문구로만 보여줍니다.
 */
// 보정치를 체크하면 공명 효율에 더하는 고정값(%)입니다.
const ER_ADJUST_VALUE = 30

function computeAggregate({ echoes, character, weaponId, weaponRank, combo, mainEchoId, erAdjust }) {
  const categoryBaseNames = getCategoryBaseNames(character?.element)
  const raw = {}
  for (const cat of Object.keys(categoryBaseNames)) raw[cat] = { percentSum: 0, flatSum: 0, echoPercentSum: 0, echoFlatSum: 0, sources: [] }
  // 합산 내역에 "어디서 왔는지"를 보여주기 위해, 더할 때마다 출처를 같이 기록합니다(같은 출처·단위는 합칩니다).
  const addSource = (cat, source, value, isPercent) => {
    const list = raw[cat].sources
    const same = list.find((x) => x.source === source && x.isPercent === isPercent)
    if (same) same.value += value
    else list.push({ source, value, isPercent })
  }
  const addPercent = (cat, val, source) => {
    const resolved = matchCategory(cat, categoryBaseNames) ?? cat
    if (!raw[resolved]) return
    raw[resolved].percentSum += val
    addSource(resolved, source, val, true)
  }

  const baseStats = getCharacterBaseStats(character?.id)
  if (baseStats) {
    for (const b of baseStats.innateBonuses ?? []) addPercent(b.category, b.value, '캐릭터 추가 옵션')
  }

  const weapon = getWeapon(weaponId)
  if (weapon) {
    if (weapon.subStat) addPercent(weapon.subStat.category, weapon.subStat.value, '무기 부옵션')
    for (const b of weaponBonusesAt(weapon, weaponRank)) addPercent(b.category, b.value, '무기 효과')
  }

  // 조합 안의 세트마다, 착용한 개수 이하의 모든 단계가 함께 적용됩니다. bonuses가 있는 단계(보통
  // 계산 가능한 고정 스탯)만 계산에 더하고, 조건부라 bonuses가 없는 단계는 설명 문구로만 표시됩니다.
  for (const { setId, pieceCount } of combo ?? []) {
    const echoSet = getEchoSet(setId)
    for (const [tier, piece] of Object.entries(echoSet?.pieces ?? {})) {
      if (Number(tier) > pieceCount) continue
      for (const b of piece.bonuses ?? []) addPercent(b.category, b.value, `${echoSet.name} ${tier}세트`)
    }
  }

  const mainEcho = getMainEcho(mainEchoId)
  if (mainEcho) {
    for (const b of mainEcho.bonuses ?? []) addPercent(b.category, b.value, '메인 에코')
    if (mainEcho.characterBonus?.characterIds.includes(character?.id)) {
      for (const b of mainEcho.characterBonus.bonuses) addPercent(b.category, b.value, '메인 에코 (전용)')
    }
  }

  echoes.forEach((echo, i) => {
    for (const s of [...echo.mainStats, ...echo.subStats]) {
      if (!s.label || !s.valueText) continue
      const cat = matchCategory(s.label, categoryBaseNames)
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
      addSource(cat, `에코 ${i + 1}`, num, s.valueText.includes('%'))
    }
  })

  if (erAdjust?.on) addPercent('공명 효율', ER_ADJUST_VALUE, '바이크 보정치')

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
    // 피해 보너스류는 기본값 없이 %를 더한 값 그대로입니다.
    case '일반 공격 피해':
    case '강공격 피해':
    case '공명 스킬 피해':
    case '공명 해방 피해':
      return { base: 0, total: raw?.percentSum ?? 0, additional: raw?.percentSum ?? 0 }
    default:
      return null
  }
}

/** 합산 내역을 출처 묶음(캐릭터·무기·세트·메인 에코·에코)으로 나누고 묶음별 합계를 냅니다. 기본값은 묶지 않습니다. */
function groupSources(sources) {
  const groupOf = (source) => {
    if (source.startsWith('캐릭터')) return '캐릭터 추가 옵션 합계'
    if (source.startsWith('무기')) return '무기 옵션 합계'
    if (source.endsWith('세트')) return '에코 세트 합계'
    if (source.startsWith('메인 에코')) return '메인 에코 합계'
    if (source.startsWith('에코 ')) return '에코 합계'
    return source
  }
  const groups = []
  for (const item of sources) {
    const name = groupOf(item.source)
    let group = groups.find((g) => g.name === name)
    if (!group) {
      group = { name, items: [], percent: 0, flat: 0 }
      groups.push(group)
    }
    group.items.push(item)
    if (item.isPercent) group.percent += item.value
    else group.flat += item.value
  }
  return groups
}

/** 선택 팝업 위쪽의 분류 탭(전체 / 5성 / 4성 … 또는 4코스트 / 3코스트 …). 분류가 하나뿐이면 숨깁니다. */
function PickerTabs({ tabs, value, onChange, format }) {
  const groupRef = useRef(null)
  const [pill, setPill] = useState(null) // 선택 표시의 위치·크기
  const all = [null, ...tabs]
  const activeIndex = all.indexOf(value)

  // 고른 탭의 위치를 재서, 배경 알약이 그 자리로 미끄러져 가게 합니다.
  useEffect(() => {
    const btn = groupRef.current?.children[activeIndex + 1] // 0번째는 알약 자신
    if (btn) setPill({ left: btn.offsetLeft, top: btn.offsetTop, width: btn.offsetWidth, height: btn.offsetHeight })
  }, [activeIndex, tabs.length])

  if (tabs.length < 2) return null
  return (
    <div className="picker-tabs" role="group" ref={groupRef}>
      <span className="picker-tabs__pill" style={pill ?? { opacity: 0 }} aria-hidden="true" />
      {all.map((t) => (
        <button
          key={t ?? 'all'}
          type="button"
          className={`picker-tabs__btn ${value === t ? 'picker-tabs__btn--on' : ''}`}
          onClick={() => onChange(t)}
        >
          {t === null ? '전체' : format(t)}
        </button>
      ))}
    </div>
  )
}

// 이 캐릭터의 무기 타입에 맞는 무기 전체를 보여주는 팝업입니다. 캐릭터에게 등록된 추천 무기
// (config/characterWeapons.js)에는 "추천" 태그를 붙여 구분합니다.
function WeaponPickerModal({ open, onClose, onSelect, options, recommendedIds }) {
  const [rarity, setRarity] = useState(null)
  const rarities = [...new Set(options.map(([, w]) => w.rarity).filter(Boolean))].sort((a, b) => b - a)
  const shown = rarity ? options.filter(([, w]) => w.rarity === rarity) : options
  return (
    <Modal wide open={open} title="무기 선택" onClose={onClose}>
      {options.length === 0 && <p className="uploader__hint">이 캐릭터가 쓸 수 있는 무기가 카탈로그에 없어요.</p>}
      <PickerTabs tabs={rarities} value={rarity} onChange={setRarity} format={(r) => `${r}성`} />
      {shown.map(([id, w]) => (
        <button key={id} className="picker-item picker-item--simple" onClick={() => onSelect(id)}>
          {w.icon && <img src={w.icon} alt={w.name} className="picker-item__icon" />}
          <span>{w.name}</span>
          {recommendedIds?.has(id) && <span className="picker-item__tag">추천</span>}
        </button>
      ))}
    </Modal>
  )
}

// 에코 세트 조합을 직접 조립하는 팝업입니다. 위쪽은 캐릭터에게 등록된 추천 조합을 한 번에 통째로
// 적용하는 버튼들이고(presetEntries), 아래쪽은 세트 하나를 지금 조합에 추가하는 줄들입니다
// (addableSets) — 세트마다 2세트/5세트로 줄을 나누지 않고, 한 줄에 세트 하나당 실제로 정의된
// 단계(1세트 전용/2·5세트 등, 남은 자리 수에 맞는 것만) 버튼을 오른쪽에 나열합니다.
function EchoComboPickerModal({ open, onClose, onSelectPreset, onAddPart, presetEntries, addableSets }) {
  return (
    <Modal wide open={open} title="에코 세트 조합" onClose={onClose}>
      {presetEntries.length > 0 && (
        <>
          <p className="picker-section-title">추천 조합 (한 번에 적용)</p>
          {presetEntries.map(({ combo }, i) => (
            <button key={i} className="picker-item picker-item--simple" onClick={() => onSelectPreset(combo)}>
              <div className="picker-item__body">
                {combo.map((p) => {
                  const set = getEchoSet(p.setId)
                  return (
                    <span key={p.setId} className="picker-item__combo-part">
                      {set?.icon && <img src={set.icon} alt="" className="picker-item__icon" />}
                      {set?.name ?? p.setId}
                      <span className="picker-item__tier-btn">{p.pieceCount}세트</span>
                    </span>
                  )
                })}
              </div>
              <span className="picker-item__tag">추천</span>
            </button>
          ))}
        </>
      )}
      <p className="picker-section-title">세트 추가</p>
      {addableSets.length === 0 && <p className="uploader__hint">더 추가할 수 있는 세트가 없어요(5세트 가득 참).</p>}
      {addableSets.map(({ setId, name, icon, tiers }) => (
        <div key={setId} className="picker-item picker-item--addable">
          {icon && <img src={icon} alt={name} className="picker-item__icon" />}
          <span>{name}</span>
          <div className="picker-item__tier-group">
            {tiers.map((tier) => (
              <button key={tier} className="picker-item__tier-btn" onClick={() => onAddPart(setId, tier)}>
                {tier}세트
              </button>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  )
}

// 지금 쓰는 에코 세트 조합에 호환되는 메인 에코만 보여주는 팝업입니다(에코 세트에 종속).
// 후보가 하나뿐이면 이 팝업을 열 일 자체가 없습니다(고정).
function MainEchoPickerModal({ open, onClose, onSelect, mainEchoIds }) {
  const [cost, setCost] = useState(null)
  const costs = [...new Set(mainEchoIds.map((id) => getMainEcho(id)?.cost).filter(Boolean))].sort((a, b) => b - a)
  const shown = cost ? mainEchoIds.filter((id) => getMainEcho(id)?.cost === cost) : mainEchoIds
  return (
    <Modal wide open={open} title="메인 에코 선택" onClose={onClose}>
      <PickerTabs tabs={costs} value={cost} onChange={setCost} format={(c) => `${c}코스트`} />
      {shown.map((id) => {
        const echo = getMainEcho(id)
        return (
          <button key={id} className="picker-item picker-item--simple" onClick={() => onSelect(id)}>
            {echo?.icon && <img src={echo.icon} alt={echo?.name} className="picker-item__icon" />}
            <span>{echo?.name ?? id}</span>
          </button>
        )
      })}
    </Modal>
  )
}

const BASE_ONLY_CATEGORIES = new Set(['HP', '공격력', '방어력'])

function formatChance(s) {
  const attempts = Number.isFinite(s.attempts) ? `약 ${Math.ceil(s.attempts).toLocaleString()}개` : '-'
  // 0.01% 미만은 toFixed(2)로 자르면 0.0052%가 "0.01%"로 보여서, 계획 요약처럼 유효 숫자 2자리로 보여 줍니다.
  const chance = s.probability >= 0.01 ? s.probability.toFixed(2) : String(Number(s.probability.toPrecision(2)))
  return `뜰 확률 ${chance}% · 기대 시도 ${attempts}`
}


/** 계획의 확률 표시: 0.01% 미만은 유효 숫자 2자리로(0.0034%처럼) 보여 줍니다. */
const formatPlanChance = (p) => (p >= 0.01 ? `${p.toFixed(2)}%` : `${Number(p.toPrecision(2))}%`)

const fmtStat = (isWhole, v) => (isWhole ? Math.floor(v).toLocaleString() : `${v.toFixed(1)}%`)
const fmtGain = (isWhole, v) => (isWhole ? `+${Math.round(v).toLocaleString()}` : `+${v.toFixed(1)}%`)

/**
 * 목표 스탯 계산기 결과(여러 목표를 한 번에 채우는 계획) — 왼쪽/오른쪽 두 칸.
 * 왼쪽(스크롤해도 따라옴): 방법 비교, 계획 고르기(빠른·안정적인), 고른 계획의 요약과 목표별 "지금 → 다 바꾸면", 강화하러 가기.
 * 오른쪽: 고른 계획의 에코별 교체 카드(빼는 옵션 → 붙어야 할 옵션, 유지할 옵션, 오르는 양, 확률).
 */
function JointResult({ results, echoes, onStartMission }) {
  const { meta = [], goals = [], plan } = results
  const [pick, setPick] = useState('fast') // 계획이 둘일 때 고른 쪽
  if (meta.length === 0) return <p className="optimizer__estimate">목표를 하나 이상 0보다 크게 입력해주세요.</p>
  if (goals.length === 0) return <p className="optimizer__estimate">넣은 목표를 이미 모두 달성했어요!</p>
  // 증가량(% 단위)을 스탯 단위로: 공격력·HP·방어력은 기준값 × %
  const toStat = (g, pct) => (g.isWhole ? (pct / 100) * g.base : pct)
  const afterOf = (p) => goals.map((g, i) => g.current + toStat(g, p.steps.reduce((sum, st) => sum + st.gains[i], 0)))

  const sig = (p) => p?.steps.map((st) => `${st.echoIndex}:${st.changes.map((c) => c.label + c.to).join(',')}`).join('|')
  const strategies = plan?.strategies ?? {}
  const bestKey = ['minmax', 'flat', 'mixed']
    .filter((k) => strategies[k]?.fast)
    .reduce((bk, k) => (!bk || strategies[k].fast.attempts < strategies[bk].fast.attempts - 0.5 ? k : bk), null)
  const same = plan?.fast && sig(plan.fast) === sig(plan.safe)
  const current = !plan?.fast ? null : same || pick === 'fast' || !plan.safe ? plan.fast : plan.safe
  const after = current ? afterOf(current) : []
  const running = goals.map((g) => g.current)

  return (
    <div className="optimizer__results optimizer__joint">
      {/* 왼쪽: 한눈에 보는 요약 */}
      <aside className="optimizer__joint-side">
        <p className="optimizer__result-title">목표 {goals.map((g) => g.category).join(' · ')}</p>
        <table className="optimizer__compare">
          <thead>
            <tr>
              <th>방법</th>
              <th>교체</th>
              <th>총 평균 시도</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['minmax', '민맥싱만'],
              ['flat', '깡만'],
              ['mixed', '섞어서'],
            ]
              .filter(([k]) => strategies[k])
              .map(([k, label]) => {
                const f = strategies[k].fast
                return (
                  <tr key={k} className={k === bestKey ? 'optimizer__compare-best' : ''}>
                    <td>{label}</td>
                    {f ? (
                      <>
                        <td>{f.steps.length}번</td>
                        <td>약 {Math.round(f.attempts).toLocaleString()}개</td>
                      </>
                    ) : (
                      <td colSpan={2} className="optimizer__compare-no">
                        못 채워요
                      </td>
                    )}
                  </tr>
                )
              })}
          </tbody>
        </table>

        {!current ? (
          <p className="optimizer__estimate">에코마다 한 번씩 바꿔도 목표를 다 못 채워요. 목표를 낮추거나, 0을 넣어 포기할 옵션을 정해 보세요.</p>
        ) : (
          <>
            {same ? (
              <div className="optimizer__plan-head">
                <span className="optimizer__plan-badge">추천 계획</span>
                <span className="optimizer__plan-desc">가장 빠르면서 가장 안정적인 계획이에요</span>
              </div>
            ) : (
              <div className="optimizer__plan-pick" role="tablist" aria-label="계획">
                {[
                  ['fast', '빠른 계획', '시도 합이 가장 적어요'],
                  ['safe', '안정적인 계획', '교체마다 잘 떠요'],
                ].map(([k, title, desc]) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={pick === k}
                    className={`optimizer__plan-pick-btn optimizer__plan-pick-btn--${k} ${pick === k ? 'optimizer__plan-pick-btn--on' : ''}`}
                    onClick={() => setPick(k)}
                  >
                    <b>{title}</b>
                    <small>{desc}</small>
                  </button>
                ))}
              </div>
            )}
            <div className="optimizer__plan-stats">
              <span>
                <small>교체</small>
                <b>{current.steps.length}번</b>
              </span>
              <span>
                <small>총 평균 시도</small>
                <b>약 {Math.round(current.attempts).toLocaleString()}개</b>
              </span>
              <span>
                <small>가장 어려운 교체</small>
                <b>{formatPlanChance(current.minProbability)}</b>
              </span>
            </div>
            <ul className="optimizer__goal-after">
              {goals.map((g, i) => (
                <li key={g.category}>
                  <span>{g.category}</span>
                  <b>
                    {fmtStat(g.isWhole, g.current)} → <strong>{fmtStat(g.isWhole, after[i])}</strong>
                  </b>
                  <small>목표 {fmtStat(g.isWhole, g.target)}</small>
                </li>
              ))}
            </ul>
            {onStartMission && (
              <button type="button" className="btn btn--primary optimizer__mission-btn" onClick={() => onStartMission(current.steps)}>
                이 계획으로 강화하러 가기
              </button>
            )}
          </>
        )}
      </aside>

      {/* 오른쪽: 고른 계획의 에코별 교체 */}
      <div className="optimizer__joint-main">
        {current && (
          <ul className="optimizer__steps">
            {current.steps.map((st, si) => {
              const removed = st.changes.filter((c) => c.kind !== 'add').map((c) => (c.kind === 'upgrade' ? `${c.label} ${c.from}` : `${c.fromLabel} ${c.fromValue}`))
              const added = st.changes.map((c) => `${c.label} ${c.to}`)
              const lines = goals
                .map((g, i) => {
                  if (st.gains[i] <= 1e-9) return null
                  const before = running[i]
                  running[i] = before + toStat(g, st.gains[i])
                  return { g, before, after: running[i], gain: toStat(g, st.gains[i]) }
                })
                .filter(Boolean)
              return (
                <li key={si} className="optimizer__step-card">
                  <div className="optimizer__step-head-row">
                    <span className="optimizer__step-header">
                      에코 {st.echoIndex + 1}
                      {getEchoCost(echoes[st.echoIndex]) && <span className="stats-page__chip-cost">COST {getEchoCost(echoes[st.echoIndex])}</span>}
                    </span>
                    <span className="optimizer__step-chance">{formatChance(st)}</span>
                  </div>
                  <p className="optimizer__swap">
                    {removed.map((r) => (
                      <span key={r} className="optimizer__swap-from">
                        {r}
                      </span>
                    ))}
                    {removed.length > 0 && <span className="optimizer__swap-arrow">→</span>}
                    {added.map((x) => (
                      <span key={x} className="optimizer__swap-to">
                        {x}
                      </span>
                    ))}
                  </p>
                  {st.keep.length > 0 && (
                    <p className="optimizer__keep">유지: {st.keep.map((k) => `${k.label} ${k.label.endsWith('%') ? `${k.value}%` : k.value} 이상`).join(' · ')}</p>
                  )}
                  {lines.map((l) => (
                    <p key={l.g.category} className="optimizer__swap-stat">
                      {l.g.category} {fmtStat(l.g.isWhole, l.before)} → <strong>{fmtStat(l.g.isWhole, l.after)}</strong>
                      <em>({fmtGain(l.g.isWhole, l.gain)})</em>
                    </p>
                  ))}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// 목표 스탯 입력값: 빌드 체크(입력) → 최적화 화면(결과)으로 넘어가도 남도록 캐릭터별로 세션 저장소에 둡니다.
const targetsKey = (characterId) => `optimizer-targets:${characterId ?? '-'}`
function loadTargets(characterId) {
  try {
    return JSON.parse(sessionStorage.getItem(targetsKey(characterId)) ?? '{}') ?? {}
  } catch {
    return {}
  }
}
function saveTargets(characterId, targets) {
  try {
    sessionStorage.setItem(targetsKey(characterId), JSON.stringify(targets))
  } catch {
    // 저장소를 못 쓰면 결과 화면에서 목표가 비어 보일 뿐입니다.
  }
}

// mode: 'input'(빌드 체크: 목표 입력 + 계산하기) / 'result'(최적화 화면: 저장된 목표로 바로 계산한 결과만)
function OptimizerPanel({
  mode = 'input',
  character,
  onStartMission,
  characterId,
  onSubmit,
  wide = false,
  echoes,
  validLabels,
  raw,
  baseStats,
  weaponData,
  onResultsChange,
  onFocusEcho,
  onUpdateSubStats,
}) {
  const [targets, setTargets] = useState(() => loadTargets(characterId))
  const lastContextRef = useRef(null) // 마지막 계산에 쓴 에코(넘친 몫 표시)·유효 옵션(포기 반영) — 강화 목표로 넘길 때 씀
  const [ran, setRan] = useState(false)
  const [results, setResults] = useState({})
  // 목표에 0을 넣은 스탯은 "포기": 유효 옵션이어도 무효로 봅니다(그 자리를 다른 옵션으로 바꿀 수 있음).
  // 목표를 이미 넘긴 스탯은 넘친 만큼의 옵션을 무효(바꿔도 되는 자리)로 봅니다. 예: 공명 효율 140 목표인데 지금 150이면 10만큼.
  const planContext = () => {
    const abandoned = OPTIMIZER_TARGET_ORDER.filter((cat) => String(targets[cat] ?? '').trim() === '0')
    const dropLabels = new Set(
      abandoned.flatMap((cat) => [OPTIMIZER_CATEGORIES[cat]?.percentLabel, OPTIMIZER_CATEGORIES[cat]?.flatLabel].filter(Boolean)),
    )
    const effectiveValid = validLabels.filter((l) => !dropLabels.has(l))
    // 서브 옵션 id는 에코마다 stat-0, stat-1…로 겹쳐서, id가 아니라 옵션 자체로 표시합니다.
    const freeSubs = new Set()
    for (const cat of OPTIMIZER_TARGET_ORDER) {
      const t = parseFloat(targets[cat])
      if (!t || t <= 0) continue
      const calc = computeCategoryTotal(cat, raw[cat], baseStats, weaponData)
      let margin = calc.total - t
      if (!(margin > 0)) continue
      const info = OPTIMIZER_CATEGORIES[cat]
      const isBase = BASE_ONLY_CATEGORIES.has(cat)
      // 이 스탯을 주는 서브 옵션을 작은 것부터, 빼도 목표 아래로 안 내려가는 만큼 무효로 표시합니다.
      const subs = echoes
        .flatMap((e) => e.subStats.map((s) => ({ s, e })))
        .filter(({ s }) => s.valueText && (s.label === info?.percentLabel || s.label === info?.flatLabel))
        .map(({ s }) => {
          const v = parseFloat(s.valueText)
          const amount = s.label === info.flatLabel ? v : isBase ? (v / 100) * calc.base : v
          return { s, amount }
        })
        .sort((a, b) => a.amount - b.amount)
      for (const sub of subs) {
        if (sub.amount > margin) break
        margin -= sub.amount
        freeSubs.add(sub.s)
      }
    }
    const planEchoes = echoes.map((e) => ({ ...e, subStats: e.subStats.map((s) => (freeSubs.has(s) ? { ...s, free: true } : s)) }))
    return { echoes: planEchoes, validLabels: effectiveValid }
  }

  const handleCalculate = () => {
    const ctx = planContext()
    lastContextRef.current = ctx
    // 목표마다 현재값·목표값을 정리하고, 아직 못 채운 목표만 한 번에 푸는 계획을 만듭니다.
    const meta = []
    for (const cat of OPTIMIZER_TARGET_ORDER) {
      const t = parseFloat(targets[cat])
      if (!t || t <= 0) continue
      const calc = computeCategoryTotal(cat, raw[cat], baseStats, weaponData)
      const isWhole = BASE_ONLY_CATEGORIES.has(cat)
      const gap = t - calc.total
      meta.push({
        category: cat,
        info: OPTIMIZER_CATEGORIES[cat],
        current: calc.total,
        target: t,
        base: isWhole ? calc.base : null,
        isWhole,
        achieved: gap <= 0,
        // 계산은 % 단위로: 공격력·HP·방어력은 기준값 대비 %, 나머지는 그대로
        need: gap <= 0 ? 0 : isWhole ? (calc.base > 0 ? (gap / calc.base) * 100 : Infinity) : gap,
      })
    }
    const goals = meta.filter((m) => !m.achieved && Number.isFinite(m.need))
    const plan = goals.length ? planJoint({ goals, echoes: ctx.echoes, validLabels: ctx.validLabels }) : null
    setResults({ meta, goals, plan })
    setRan(true)
    onResultsChange?.({})
  }

  // 서브스탯을 직접 고치면(에코 편집 패널에서) 이미 계산해본 적이 있을 때만 자동으로 다시 계산해서,
  // 방금 바꾼 결과가 곧바로 반영된 "남은 퍼센트"를 보여줍니다.
  useEffect(() => {
    if (!ran) return
    handleCalculate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echoes])

  // 결과 화면: 들어오자마자 저장된 목표로 계산합니다.
  useEffect(() => {
    if (mode === 'result') handleCalculate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const submit = () => {
    saveTargets(characterId, targets)
    onSubmit?.()
  }

  return (
    <div className={`optimizer ${wide ? 'optimizer--wide' : ''} optimizer--${mode}`}>
      <div className="optimizer__title-row">
        <h4 className="stats-page__col-title mobile-section__heading">목표 스탯 계산기 - 베타</h4>
        {/* 터치 기기는 마우스 오버가 없어서, 눌러서 포커스를 줘도 열리게 합니다. */}
        <span className="optimizer__info" tabIndex={0} role="button" aria-label="계산식 보기">
          i
        </span>
        <div className="optimizer__formula" role="tooltip">
          <p>성공 확률 = 옵션이 모두 뜰 확률 × 목표 수치 이상이 뜰 확률</p>
          <p>
            옵션이 모두 뜰 확률 = C({SUB_STAT_NAMES.length}-n, 5-n) ÷ C({SUB_STAT_NAMES.length}, 5)
            <br />
            n = 지켜야 할 유효 옵션 수 + 목표 옵션 1개
          </p>
          <p>평균 시도 횟수 = 100 ÷ 성공 확률(%)</p>
        </div>
      </div>
      <p className="uploader__hint optimizer__hint">
        계산 결과는 어디까지나 참고용이며, 실제 게임 내 확률과 다를 수 있습니다.
      </p>
      {mode === 'input' && (
      <>
      <div className="optimizer__grid">
        {OPTIMIZER_TARGET_ORDER.map((cat) => (
          <label key={cat} className="optimizer__field">
            {cat}
            <input
              type="number"
              placeholder="-"
              value={targets[cat] ?? ''}
              onChange={(e) => setTargets((prev) => ({ ...prev, [cat]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <button className="btn btn--primary optimizer__calc-btn" onClick={submit}>계산하기</button>
      <p className="optimizer__notice">
        0을 넣으면 유효 옵션이라도 그 옵션은 없는 옵션으로 처리합니다.
        <br />
        목표보다 높은 스탯은 넘친 만큼의 옵션을 다른 옵션으로 변경 가능한 자리로 봅니다.
      </p>
      </>
      )}

      {mode === 'result' && ran && (
        <JointResult
          results={results}
          echoes={echoes}
          character={character}
          onStartMission={onStartMission ? (steps) => {
            startMission({ character, category: results.goals.map((g) => g.category).join(' · '), steps, ...(lastContextRef.current ?? { echoes, validLabels }), joint: true })
            onStartMission()
          } : null}
        />
      )}
    </div>
  )
}

export default function StatsPage({
  echoes,
  character,
  weapon,
  weaponRank = 1,
  onSetWeaponRank,
  echoParts: savedEchoParts,
  mainEchoId: selectedMainEchoId,
  onSetWeapon,
  onSetEchoParts,
  onSetMainEchoId,
  erAdjust = { on: false },
  onSetErAdjust,
  onUpdateSubStats,
  onUpdateMainStats,
  onUpdateCost,
  onReplaceOne,
  onAddEcho,
  onMoveEcho,
  onGoToCharacters,
  onReset,
  // 목표 스탯 계산기를 따로 연 화면(최적화하기 → 돌아가기)
  optimizeMode = false,
  onStartMission,
  onOpenOptimizer,
  onBackFromOptimizer,
}) {
  const [resetOpen, setResetOpen] = useState(false)
  // 유효 옵션 안내 말풍선: 화면에 들어오면 처음엔 무조건 펼쳐 두고, 화면 아무 곳이나 누르면 닫힙니다. i로 다시 열 수 있어요.
  const [validInfoOpen, setValidInfoOpen] = useState(true)
  // 유효 옵션 안내 말풍선이 좁은 화면에서 오른쪽 밖으로 잘리지 않게, 열릴 때 화면 안으로 당깁니다(꼬리는 i 아래 그대로).
  const validNoticeRef = useRef(null)
  useLayoutEffect(() => {
    const el = validNoticeRef.current
    if (!el) return
    el.style.left = ''
    el.style.removeProperty('--tail-x')
    const over = el.getBoundingClientRect().right - (window.innerWidth - 12)
    if (over > 0) {
      el.style.left = `${-over}px`
      el.style.setProperty('--tail-x', `${64 + over}px`)
    }
  }, [validInfoOpen])
  useEffect(() => {
    if (!validInfoOpen) return
    const close = () => setValidInfoOpen(false)
    // 여는 클릭이 그대로 닫는 클릭이 되지 않게 다음 순간부터 듣습니다.
    const id = setTimeout(() => document.addEventListener('pointerdown', close), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('pointerdown', close)
    }
  }, [validInfoOpen])
  const [retakeOpen, setRetakeOpen] = useState(false)
  const [weaponModalOpen, setWeaponModalOpen] = useState(false)
  const [comboModalOpen, setComboModalOpen] = useState(false)
  const [mainEchoModalOpen, setMainEchoModalOpen] = useState(false)
  // 모바일: 무기/에코 세트/메인 에코 중 하나만 펼칩니다. 처음엔 무기, 다른 걸 누르면 그쪽이 열리고 원래 건 닫힘.
  const [openLoadout, setOpenLoadout] = useState('weapon')
  const loadoutSection = (key) => ({
    always: true,
    open: openLoadout === key,
    // 항상 하나는 열려 있도록, 열린 섹션을 다시 눌러도 닫지 않습니다.
    onToggle: () => setOpenLoadout(key),
  })
  const openWeaponModal = () => setWeaponModalOpen(true)
  const openComboModal = () => setComboModalOpen(true)
  const [selectedEchoIdx, setSelectedEchoIdx] = useState(0)
  const [optimizerResults, setOptimizerResults] = useState({})
  const [blink, setBlink] = useState(null) // { echoIndex, label, value, token } — 방금 클릭한 추천의 위치
  const echoEditorRef = useRef(null)
  const blinkTimeoutRef = useRef(null)
  const aggregateColRef = useRef(null)
  const [aggregateColHeight, setAggregateColHeight] = useState(null)
  // 합산 스탯 표에서 출처 내역을 펼쳐 둔 카테고리입니다.
  const [openStatCat, setOpenStatCat] = useState(null)
  const validLabels = getValidOptions(character?.id)

  // 이 캐릭터에게 등록된(추천) 에코 세트 조합입니다. 등록 안 된 캐릭터는 null.
  const recommendedCombos = getCharacterEchoCombos(character?.id)
  // 사용자가 세트 추가/삭제로 직접 조립한 조합입니다. 한 번도 안 건드렸으면 null이라 추천 조합
  // 중 첫 번째를 기본값으로 씁니다. 전부 삭제하면 빈 배열이 되어 "선택된 세트 없음" 상태입니다.
  const combo = savedEchoParts ?? recommendedCombos?.[0] ?? null
  const comboParts = combo ?? []
  const usedSetIds = new Set(comboParts.map((p) => p.setId))
  const totalPieces = comboParts.reduce((sum, p) => sum + p.pieceCount, 0)
  const remainingPieces = 5 - totalPieces
  // 지금 조합에 없는 세트 중 남은 자리 수에 들어가는 단계만 "추가" 후보로 보여줍니다. 세트마다
  // 정의된 단계가 다르므로(1세트 전용, 2·5세트 등) 무조건 5세트로 취급하지 않고, 세트 하나당
  // 한 줄에 그 세트가 가질 수 있는 단계 버튼들을 같이 묶어서 보여줍니다.
  // 최근에 등록한 세트가 먼저 오도록 DB 정렬 순서(sort_order)를 뒤집습니다(관리자 페이지와 같은 순서).
  const addableSets = Object.entries(ECHO_SETS)
    .reverse()
    .filter(([id]) => !usedSetIds.has(id))
    .map(([id, set]) => ({
      setId: id,
      name: set.name,
      icon: set.icon,
      tiers: Object.keys(set.pieces).map(Number).filter((tier) => tier <= remainingPieces).sort((a, b) => a - b),
    }))
    .filter((s) => s.tiers.length > 0)
  // 캐릭터에게 등록된 추천 조합을 한 번에 통째로 적용하는 퀵 버튼 목록입니다.
  const presetEntries = (recommendedCombos ?? []).map((c) => ({ combo: c }))
  const addEchoSetPart = (setId, pieceCount) => onSetEchoParts([...comboParts, { setId, pieceCount }])
  const removeEchoSetPart = (setId) => onSetEchoParts(comboParts.filter((p) => p.setId !== setId))
  const applyEchoPreset = (presetCombo) => onSetEchoParts(presetCombo)
  // 사용 메인 에코는 지금 쓰는 에코 세트 조합에 종속됩니다 — 그 조합과 호환되는 메인 에코만
  // 고를 수 있고(config/echoSetMainEchoes.js), 후보가 하나뿐이면 고정입니다.
  const mainEchoIds = getMainEchoIdsForCombo(combo)
  const mainEchoId =
    selectedMainEchoId && mainEchoIds.includes(selectedMainEchoId) ? selectedMainEchoId : (mainEchoIds[0] ?? null)
  const mainEcho = getMainEcho(mainEchoId)
  // 캐릭터에 따라 에코 어빌리티 자체가 대체되는 메인 에코(예: 루시/레베카 전용 효과)는
  // characterDescriptions에 등록된 문구가 있으면 그걸 우선 보여주고, 없으면 원래 description을 씁니다.
  const mainEchoDescription = mainEcho?.characterDescriptions?.[character?.id] ?? mainEcho?.description ?? null

  // 무기 선택은 캐릭터의 무기 타입 전체를 보여줍니다(타입 미지정이면 카탈로그 전체 허용).
  // 캐릭터별 추천 무기 목록(config/characterWeapons.js)이 있으면 그중 해당하는 것만 "추천"
  // 태그로 구분합니다.
  const characterWeaponIds = getCharacterWeaponIds(character?.id)
  const recommendedWeaponIds = new Set(characterWeaponIds ?? [])
  // 최근에 등록한 무기가 먼저 오도록 DB 정렬 순서(sort_order)를 뒤집습니다(관리자 페이지와 같은 순서).
  const weaponOptions = Object.entries(WEAPONS)
    .reverse()
    .filter(([, w]) => !character?.weaponType || w.type === character.weaponType)
  // 사용자가 직접 고른 무기가 없으면(null), 캐릭터별 추천 무기 목록의 첫 번째를 기본으로 씁니다.
  // 추천 목록이 없는 캐릭터는 그대로 미선택 상태(+ 무기 선택)로 남습니다.
  const weaponId = weapon ?? characterWeaponIds?.[0] ?? null

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

  // 오른쪽 칸(목표 계산기, 교체 우선순위)을 왼쪽 카드와 위·아래 끝까지 맞춥니다.
  // 서로 다른 칸이라 CSS만으로는 못 맞춰서, 왼쪽 카드의 실제 위치를 재서 오른쪽 칸 기준 좌표로 옮깁니다.
  // 넓은 화면(두 칸 배치)에서만 쓰고, 좁은 화면은 원래대로 세로로 쌓습니다.
  // 에코 순서 바꾸기(드래그): 끌고 있는 칸과 놓으려는 칸
  const [dragFrom, setDragFrom] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [reordering, setReordering] = useState(false) // [순서 변경]을 누르면 칸마다 ▲▼가 나옵니다
  // 순서를 바꾸고, 고른 에코는 옮긴 자리를 따라가게 합니다(오른쪽 편집 칸이 같은 에코 유지).
  const moveEchoAndFollow = (from, to) => {
    const selectedId = echoes[selectedEchoIdx]?.id
    const order = echoes.map((x) => x.id)
    const [moved] = order.splice(from, 1)
    order.splice(to, 0, moved)
    onMoveEcho(from, to)
    const nextIdx = order.indexOf(selectedId)
    if (nextIdx >= 0) focusEcho(nextIdx, null, false)
  }
  const optimizerWrapRef = useRef(null)
  const [sideLayout, setSideLayout] = useState(null)
  useEffect(() => {
    const wrap = optimizerWrapRef.current
    const agg = aggregateColRef.current
    const editor = echoEditorRef.current?.querySelector('.echo-editor')
    if (!wrap || !agg) return
    const wide = window.matchMedia('(min-width: 1101px)')
    const measure = () => {
      if (!wide.matches) return setSideLayout(null)
      const base = wrap.getBoundingClientRect().top
      const a = agg.getBoundingClientRect()
      const e = editor?.getBoundingClientRect()
      const next = {
        calc: { top: a.top - base, height: a.height },
        odds: e ? { top: e.top - base, height: e.height } : null,
      }
      // 값이 같으면 다시 그리지 않습니다. 매번 새로 그리면 애니메이션 → 다시 재기 → 다시 그리기가 끝없이 돌아 화면이 떨립니다.
      setSideLayout((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    // 왼쪽 카드는 크기가 그대로여도 위쪽 내용(이미지·글꼴 로딩, 접기/펴기)에 따라 자리가 밀릴 수 있어서,
    // 카드 자체뿐 아니라 본문 전체와 창 크기 변화, 글꼴 로딩 완료 때도 다시 잽니다.
    // 화면이 처음 뜰 때 커지며 나타나는 애니메이션 도중에 재면 줄어든 크기가 잡혀서, 애니메이션이 끝날 때도 다시 잽니다.
    const observer = new ResizeObserver(measure)
    observer.observe(wrap)
    observer.observe(agg)
    if (editor) observer.observe(editor)
    const main = wrap.parentElement?.querySelector('.stats-page__main')
    if (main) observer.observe(main)
    observer.observe(document.body)
    wide.addEventListener('change', measure)
    window.addEventListener('resize', measure)
    window.addEventListener('load', measure)
    document.addEventListener('animationend', measure, true)
    document.addEventListener('transitionend', measure, true)
    document.fonts?.ready.then(measure)
    return () => {
      observer.disconnect()
      wide.removeEventListener('change', measure)
      window.removeEventListener('resize', measure)
      window.removeEventListener('load', measure)
      document.removeEventListener('animationend', measure, true)
      document.removeEventListener('transitionend', measure, true)
    }
  }, [echoes.length > 0, optimizeMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // 최적화 화면: 빠른/안정적인 계획을 바꾸면 결과 줄 수가 달라 아래 푸터가 오르내려서,
  // 지금까지 가장 컸던 높이를 최소 높이로 붙잡아 둡니다(줄어들지 않고 늘어나기만 함).
  const optimizePageRef = useRef(null)
  useEffect(() => {
    const node = optimizePageRef.current
    if (!node) return
    let max = 0
    const observer = new ResizeObserver(() => {
      const height = node.scrollHeight
      if (height > max) {
        max = height
        node.style.minHeight = `${max}px`
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [optimizeMode])

  // 각 항목은 "추천이 나온 시점의 상태"(라벨+수치)를 담고 있어서, 사용자가 그 자리를 조금이라도
  // 바꾸면 더 이상 일치하지 않아 하늘색 표시가 자동으로 풀립니다.
  const suggestedStatsForSelected = []
  Object.values(optimizerResults).forEach((r) => {
    r?.steps?.forEach((s) => {
      if (s.echoIndex !== selectedEchoIdx) return
      if (s.action === 'replace') suggestedStatsForSelected.push({ label: s.fromLabel, value: s.fromValue })
      else if (s.action === 'upgrade') suggestedStatsForSelected.push({ label: s.label, value: s.fromValue })
    })
  })

  const totalCost = echoes.reduce((sum, echo) => sum + (Number(getEchoCost(echo)) || 0), 0)
  const { raw: aggregate, baseStats, weapon: weaponData } = computeAggregate({
    echoes,
    character,
    weaponId,
    weaponRank,
    combo,
    mainEchoId,
    erAdjust,
  })
  // "합산 스탯" 표에 보여줄 행 순서입니다 — 캐릭터 속성에 맞는 피해 보너스 행 이름이 여기 포함됩니다.
  const categoryOrder = Object.keys(getCategoryBaseNames(character?.element))

  // 메인 에코 데미지 보너스 계산식이 참고할 수 있는 최종 합산 전투 스탯입니다.
  const combatStats = {
    atk: computeCategoryTotal('공격력', aggregate['공격력'], baseStats, weaponData)?.total ?? 0,
    def: computeCategoryTotal('방어력', aggregate['방어력'], baseStats, weaponData)?.total ?? 0,
    hp: computeCategoryTotal('HP', aggregate['HP'], baseStats, weaponData)?.total ?? 0,
    critRate: computeCategoryTotal('크리티컬', aggregate['크리티컬'], baseStats, weaponData)?.total ?? 0,
    critDmg: computeCategoryTotal('크리티컬 피해', aggregate['크리티컬 피해'], baseStats, weaponData)?.total ?? 0,
  }
  const mainEchoDamageBonus = getMainEchoDamageBonus(character?.id, mainEchoId, combatStats)

  // 최적화하기 화면: 목표 스탯 계산기만 넓게 보여 주고, 빠른 계획 / 안정적인 계획을 나란히 둡니다.
  if (optimizeMode) {
    return (
      <section className="stats-page optimize-page" ref={optimizePageRef}>
        <header className="optimize-page__head">
          <div>
            <span className="uploader__eyebrow">목표 스탯 계산기 - 베타</span>
            <h2>{character?.name} 최적화</h2>
          </div>
          <button className="capture-page__back capture-page__back--nav" onClick={onBackFromOptimizer}>
            ← 돌아가기
          </button>
        </header>
        <OptimizerPanel
          mode="result"
          characterId={character?.id}
          character={character}
          onStartMission={onStartMission}
          wide
          echoes={echoes}
          validLabels={validLabels}
          raw={aggregate}
          baseStats={baseStats}
          weaponData={weaponData}
          onResultsChange={setOptimizerResults}
          onUpdateSubStats={onUpdateSubStats}
        />
      </section>
    )
  }

  return (
    <section className="stats-page">
      <div className="stats-page__layout">
      <div className="stats-page__main">
      <header className="stats-page__head">
        <div className="stats-page__head-top">
          <span className="uploader__eyebrow">점수 통계</span>
          {/* 모바일 전용: 캡처·편집 화면처럼 제목 줄 오른쪽에 둡니다. PC에서는 오른쪽 계산기 칸 위의 버튼을 씁니다. */}
          <div className="stats-page__head-actions stats-page__head-actions--mobile">
            <button className="capture-page__back capture-page__back--danger" onClick={() => setResetOpen(true)}>초기화</button>
            <button className="capture-page__back capture-page__back--nav" onClick={onGoToCharacters}>← 캐릭터 선택으로</button>
          </div>
        </div>
        <h2>상세 정보</h2>
        <p className="uploader__hint">유효 옵션은 노란색으로 표시됩니다.</p>
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
          {character?.element && (
            <p className="stats-page__char-element" style={{ color: ELEMENT_COLORS[character.element] }}>
              {character.element}
            </p>
          )}

          <div className="optimizer__title-row stats-page__valid-title">
            <h4>유효 옵션</h4>
            <button
              type="button"
              className="optimizer__info stats-page__valid-info-btn"
              aria-label="유효 옵션 안내"
              aria-expanded={validInfoOpen}
              // 열린 상태에서 i를 누르면 "아무 곳 클릭 → 닫힘"과 겹쳐 다시 열리지 않게, i 클릭은 여기서만 처리합니다.
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setValidInfoOpen((v) => !v)}
            >
              i
            </button>
            {/* 유효 옵션 기준 안내: 피해 유형을 고르게 쓰는 캐릭터(청초·페비 등)는 빠진 피해 보너스도 도움이 될 수 있음 */}
            {validInfoOpen && (
              <div className="stats-page__valid-notice" role="note" ref={validNoticeRef}>
                <b>이 유효 옵션은 공식에서 권장하는 옵션이에요.</b>
                <span>청초, 페비처럼 여러 피해 유형을 고르게 쓰는 캐릭터는 유효 옵션에 없는 피해 보너스도 실제로는 도움이 될 수 있어요.</span>
                <span>점수는 참고용으로 봐 주세요.</span>
                <small>화면 아무 곳이나 누르면 닫혀요.</small>
              </div>
            )}
          </div>
          <ul className="stats-page__valid-list">
            {validLabels.length === 0 && <li className="echo-panel__empty">설정된 유효 옵션 없음</li>}
            {validLabels.map((label) => <li key={label}>{label}</li>)}
          </ul>
        </aside>

        <aside className="stats-page__loadout">
          <MobileSection title="사용 무기" summary={weaponData?.icon && <img src={weaponData.icon} alt={weaponData.name} />} {...loadoutSection('weapon')}>
          <h4 className="mobile-section__heading">사용 무기</h4>
          {weaponData ? (
            <div className="stats-page__chip-card">
              <div className="stats-page__chip-head">
                {weaponData.icon && <img src={weaponData.icon} alt={weaponData.name} />}
                <span>{weaponData.name}</span>
                {hasRankValues(weaponData) && (
                  <select
                    className="stats-page__rank-select"
                    aria-label="무기 돌파 단계"
                    value={weaponRank}
                    onChange={(e) => onSetWeaponRank?.(Number(e.target.value))}
                  >
                    {WEAPON_RANKS.map((r) => (
                      <option key={r} value={r}>
                        {r}돌파
                      </option>
                    ))}
                  </select>
                )}
                {weaponOptions.length > 1 && (
                  <button
                    className="stats-page__swap-btn"
                    onClick={openWeaponModal}
                    aria-label="무기 목록 열기"
                    title="무기 목록 열기"
                  >
                    ⇄
                  </button>
                )}
              </div>
              {weaponData.description && (
                <>
                  {weaponData.passiveName && <p className="stats-page__chip-passive">[{weaponData.passiveName}]</p>}
                  <p className="stats-page__chip-effect">{weaponDescriptionAt(weaponData, weaponRank)}</p>
                </>
              )}
            </div>
          ) : (
            <button className="btn btn--ghost stats-page__pick-btn" onClick={openWeaponModal}>
              + 무기 선택
            </button>
          )}
          </MobileSection>

          <MobileSection
            title="사용 에코 세트"
            summary={comboParts.map(({ setId }) => {
              const set = getEchoSet(setId)
              return set?.icon ? <img key={setId} src={set.icon} alt={set.name} /> : null
            })}
            {...loadoutSection('echoSet')}
          >
          <h4 className="mobile-section__heading">사용 에코 세트</h4>
          {comboParts.length > 0 ? (
            <div className="stats-page__chip-card">
              <div className="stats-page__chip-head">
                {comboParts.map(({ setId }) => {
                  const set = getEchoSet(setId)
                  return set?.icon ? <img key={setId} src={set.icon} alt={set.name} /> : null
                })}
                {(presetEntries.length > 0 || addableSets.length > 0) && (
                  <button
                    className="stats-page__swap-btn"
                    onClick={openComboModal}
                    aria-label="에코 세트 조합 관리"
                    title="에코 세트 조합 관리"
                  >
                    ⇄
                  </button>
                )}
              </div>
              {comboParts.map(({ setId, pieceCount }) => {
                const set = getEchoSet(setId)
                if (!set) return null
                const tiers = Object.entries(set.pieces)
                  .filter(([tier]) => Number(tier) <= pieceCount)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                return (
                  <div key={setId} className="stats-page__set-block">
                    {tiers.map(([tier, effect], i) => (
                      <div key={tier}>
                        <p className="stats-page__chip-passive">
                          <span>[{set.name} {tier}세트]</span>
                          {i === 0 && (
                            <button
                              className="stats-page__set-remove-btn"
                              onClick={() => removeEchoSetPart(setId)}
                              aria-label={`${set.name} 삭제`}
                              title="삭제"
                            >
                              ×
                            </button>
                          )}
                        </p>
                        <p className="stats-page__chip-effect">{effect.description}</p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <p className="uploader__hint">선택된 에코 세트가 없어요.</p>
              <button className="btn btn--ghost stats-page__pick-btn" onClick={openComboModal}>
                + 에코 세트 추가
              </button>
            </>
          )}
          </MobileSection>

          <MobileSection title="사용 메인 에코" summary={mainEcho?.icon && <img src={mainEcho.icon} alt={mainEcho.name} />} {...loadoutSection('mainEcho')}>
          <h4 className="mobile-section__heading">사용 메인 에코</h4>
          {mainEcho ? (
            <div className="stats-page__chip-card">
              <div className="stats-page__chip-head">
                {mainEcho.icon && <img src={mainEcho.icon} alt={mainEcho.name} />}
                <span>{mainEcho.name}</span>
                {mainEchoIds.length > 1 && (
                  <button
                    className="stats-page__swap-btn"
                    onClick={() => setMainEchoModalOpen(true)}
                    aria-label="메인 에코 교체"
                    title="메인 에코 교체"
                  >
                    ⇄
                  </button>
                )}
              </div>
              {mainEchoDescription && <p className="stats-page__chip-effect">{mainEchoDescription}</p>}
              {mainEcho.passiveDescription && (
                <p className="stats-page__chip-effect">{mainEcho.passiveDescription}</p>
              )}
              {mainEchoDamageBonus != null && (
                <p className="stats-page__chip-effect">데미지 보너스: +{formatPercent1(mainEchoDamageBonus)}%</p>
              )}
            </div>
          ) : (
            <p className="uploader__hint">고른 에코 세트에 연결된 메인 에코가 아직 없어요.</p>
          )}
          </MobileSection>
          <MobileSection title="활성 바이크 옵션" summary={erAdjust.on ? '공명 효율 30%' : null} {...loadoutSection('bike')}>
          <h4 className="mobile-section__heading">활성 바이크 옵션</h4>
          <div className="stats-page__er-adjust">
            <label>
              <input
                type="checkbox"
                checked={erAdjust.on}
                onChange={(e) => onSetErAdjust?.({ on: e.target.checked })}
              />
              <span>바이크 보정치 ( 공명 효율 {ER_ADJUST_VALUE}% )</span>
            </label>
          </div>
          </MobileSection>
        </aside>
        </div>

        <aside className="stats-page__aggregate-col" ref={aggregateColRef}>
          <MobileSection title="합산 스탯" defaultOpen>
          <h4 className="stats-page__col-title mobile-section__heading">합산 스탯</h4>
          <table className="full-aggregate-table">
            <thead>
              <tr>
                <th>스탯</th>
                <th>합산</th>
                <th>내역</th>
              </tr>
            </thead>
            <tbody>
              {categoryOrder.map((cat) => {
                const raw = aggregate[cat]
                // 기초값(캐릭터·무기 기본 스탯)도 출처 맨 앞에 넣어서, 펼치면 합산이 어디서 왔는지 전부 보이게 합니다.
                const baseSources = []
                if (BASE_TOTAL_CATEGORIES.has(cat)) {
                  const charBase = { HP: baseStats?.hp, 공격력: baseStats?.atk, 방어력: baseStats?.def, '공명 효율': baseStats?.energyRegen, 크리티컬: baseStats?.critRate, '크리티컬 피해': baseStats?.critDmg }[cat]
                  if (charBase) baseSources.push({ source: '캐릭터 기본', value: charBase, isPercent: !BASE_ONLY_CATEGORIES.has(cat), base: true })
                  if (cat === '공격력' && weaponData?.atk) baseSources.push({ source: '무기 기본', value: weaponData.atk, isPercent: false, base: true })
                }
                const sources = [...baseSources, ...raw.sources]
                const isOpen = openStatCat === cat
                const toggle = sources.length > 0 ? () => setOpenStatCat(isOpen ? null : cat) : undefined
                const detailRow = isOpen && (
                  <tr key={`${cat}-detail`} className="full-aggregate-table__detail">
                    <td colSpan={3}>
                      <ul>
                        {sources.filter((x) => x.base).map((x) => (
                          <li key={x.source}>
                            <span>{x.source}</span>
                            <span className="stat-base">
                              {x.isPercent ? `${formatPercent1(x.value)}%` : formatWholeStat(x.value)}
                            </span>
                          </li>
                        ))}
                        {groupSources(sources.filter((x) => !x.base)).map((group) => (
                          <Fragment key={group.name}>
                            {group.items.map((x) => (
                              <li key={`${x.source}-${x.isPercent}`} className="full-aggregate-table__group-item">
                                <span>{x.source}</span>
                                <span>{x.isPercent ? `+${formatPercent1(x.value)}%` : `+${formatWholeStat(x.value)}`}</span>
                              </li>
                            ))}
                            <li className="full-aggregate-table__group">
                              <span>{group.name}</span>
                              <span className="stat-additional">
                                {[
                                  group.percent > 0 && `+${formatPercent1(group.percent)}%`,
                                  group.flat > 0 && `+${formatWholeStat(group.flat)}`,
                                ]
                                  .filter(Boolean)
                                  .join(' / ')}
                              </span>
                            </li>
                          </Fragment>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )
                const rowProps = {
                  className: toggle ? 'full-aggregate-table__row--toggle' : undefined,
                  onClick: toggle,
                  title: toggle ? '눌러서 출처 보기' : undefined,
                }
                if (BASE_TOTAL_CATEGORIES.has(cat)) {
                  const calc = computeCategoryTotal(cat, raw, baseStats, weaponData)
                  const isWholeStat = BASE_ONLY_CATEGORIES.has(cat) // HP·공격력·방어력만 정수
                  const isPercentCat = !isWholeStat
                  const fmt = (n) => (isWholeStat ? formatWholeStat(n) : formatPercent1(n))
                  return [
                    <tr key={cat} {...rowProps}>
                      <td className="full-aggregate-table__label">{cat}</td>
                      <td className="full-aggregate-table__total">
                        {fmt(calc.total)}{isPercentCat ? '%' : ''}
                      </td>
                      <td className="full-aggregate-table__values">
                        <span className="stat-base">{fmt(calc.base)}</span>
                        {' + '}
                        <span className="stat-additional">{fmt(calc.additional)}</span>
                      </td>
                    </tr>,
                    detailRow,
                  ]
                }
                const display = raw.percentSum ? `${formatPercent1(raw.percentSum)}%` : '-'
                return [
                  <tr key={cat} {...rowProps}>
                    <td className="full-aggregate-table__label">{cat}</td>
                    <td className="full-aggregate-table__values" colSpan={2}>
                      {display === '-' ? <span className="full-aggregate-table__empty">-</span> : display}
                    </td>
                  </tr>,
                  detailRow,
                ]
              })}
            </tbody>
          </table>
          {!baseStats && (
            <p className="optimizer__estimate">
              이 캐릭터는 기초 스탯 데이터가 없어서 "합산"이 0으로 나와요. 알려주시면 추가해드릴게요.
            </p>
          )}
          <p className="stats-page__aggregate-note">공식 계산 내용이 아닙니다. 자세한 스탯은 인게임을 확인하세요.
            <span className="stats-page__aggregate-link">
            이잘키 : [{' '}
            <a href="https://arca.live/w/wutheringwaves/%EC%9D%B4%EC%A0%95%EB%8F%84%EB%A9%B4%20%EC%9E%98%ED%82%A4%EC%9B%A0%EB%8B%A4%ED%91%9C" target="_blank" rel="noreferrer">
              링크
            </a>{' '}
            ]
            </span>
          </p>
          </MobileSection>
        </aside>
      </div>

      <div className="echo-editor-wrap" ref={echoEditorRef}>
        <MobileSection title="에코 상세 설정" defaultOpen card>
        <h4 className="echo-editor__title mobile-section__heading">에코 상세 설정</h4>

        <div className="echo-editor">
            <div className="echo-editor__scores">
              <div className="stats-page__chip-title-row">
                <h4 className="stats-page__col-title">
                  에코 선택{' '}
                  <span className={totalCost > MAX_TOTAL_COST ? 'echo-editor__cost-over' : ''}>
                    (COST {totalCost}/{MAX_TOTAL_COST})
                  </span>
                </h4>
                {onMoveEcho && echoes.length > 1 && (
                  <button
                    type="button"
                    // 글자가 "순서 변경" ↔ "완료"로 바뀌어도 폭이 같게(옆 칸이 밀리지 않게) 최소 폭을 둡니다.
                    className={`stats-page__reorder-btn ${reordering ? 'stats-page__reorder-btn--on' : ''}`}
                    onClick={() => setReordering((v) => !v)}
                  >
                    {reordering ? '완료' : '순서 변경'}
                  </button>
                )}
              </div>
              {echoes.length === 0 ? (
                <p className="uploader__hint">등록된 에코가 없어요.</p>
              ) : (
                <ul className="stats-page__chip-list">
                  {echoes.map((echo, i) => (
                    <li
                      key={echo.id}
                      // 끌어서 놓으면 순서가 바뀝니다. 고른 에코는 옮긴 자리를 따라갑니다.
                      draggable={!!onMoveEcho}
                      className={`${dragFrom === i ? 'stats-page__chip--dragging' : ''} ${dragOver === i && dragFrom !== i ? 'stats-page__chip--drop' : ''}`}
                      onDragStart={(e) => {
                        setDragFrom(i)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragOver={(e) => {
                        if (dragFrom === null) return
                        e.preventDefault()
                        setDragOver(i)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (dragFrom !== null && dragFrom !== i) moveEchoAndFollow(dragFrom, i)
                        setDragFrom(null)
                        setDragOver(null)
                      }}
                      onDragEnd={() => {
                        setDragFrom(null)
                        setDragOver(null)
                      }}
                    >
                      <button
                        className={`stats-page__chip-card stats-page__chip-head--btn ${selectedEchoIdx === i ? 'stats-page__chip-card--active' : ''}`}
                        onClick={() => focusEcho(i, null, false)}
                        title={onMoveEcho ? '끌어서 순서를 바꿀 수 있어요' : undefined}
                      >
                        <div className="stats-page__chip-head">
                          <span>에코 {i + 1}</span>
                          {getEchoCost(echo) && <span className="stats-page__chip-cost">COST {getEchoCost(echo)}</span>}
                          {reordering ? (
                            // 순서 변경 중: 위/아래로 한 칸씩(맨 위·맨 아래는 더 못 가서 -로 표시). 모바일에서도 됩니다.
                            <span className="stats-page__chip-move">
                              {[
                                [-1, '▲', '위로'],
                                [1, '▼', '아래로'],
                              ].map(([step, mark, label]) => {
                                const to = i + step
                                const blocked = to < 0 || to >= echoes.length
                                return (
                                  <span
                                    key={step}
                                    role="button"
                                    tabIndex={blocked ? -1 : 0}
                                    aria-label={`에코 ${i + 1} ${label}`}
                                    aria-disabled={blocked}
                                    className={`stats-page__chip-move-btn ${blocked ? 'stats-page__chip-move-btn--off' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!blocked) moveEchoAndFollow(i, to)
                                    }}
                                    onKeyDown={(e) => {
                                      if ((e.key === 'Enter' || e.key === ' ') && !blocked) {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        moveEchoAndFollow(i, to)
                                      }
                                    }}
                                  >
                                    {blocked ? '-' : mark}
                                  </span>
                                )
                              })}
                            </span>
                          ) : (
                            <span className="stats-page__chip-arrow" aria-hidden="true">›</span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {echoes.length < 5 && (
                <button
                  className="btn btn--ghost stats-page__pick-btn"
                  onClick={() => {
                    onAddEcho()
                    focusEcho(echoes.length, null, false)
                  }}
                >
                  + 에코 추가
                </button>
              )}
            </div>

            <div className="echo-editor__panel">
              {echoes[selectedEchoIdx] && (
                <EchoPanel
                  echo={echoes[selectedEchoIdx]}
                  index={selectedEchoIdx}
                  onUpdateSubStats={onUpdateSubStats}
                  onUpdateMainStats={onUpdateMainStats}
                  validLabels={validLabels}
                  suggestedStats={suggestedStatsForSelected}
                  blinkLabel={blink?.echoIndex === selectedEchoIdx ? blink.label : null}
                  blinkValue={blink?.echoIndex === selectedEchoIdx ? blink.value : null}
                  blinkToken={blink?.token}
                  onRetake={() => setRetakeOpen(true)}
                  onUpdateCost={onUpdateCost}
                  costLimitLeft={MAX_TOTAL_COST - totalCost + (Number(getEchoCost(echoes[selectedEchoIdx])) || 0)}
                />
              )}
            </div>

            {echoes[selectedEchoIdx] && (
              <EchoScoreCard echoes={echoes} selectedIndex={selectedEchoIdx} validLabels={validLabels} />
            )}
        </div>
        </MobileSection>
      </div>
      </div>

      <div className={`stats-page__optimizer-wrap ${sideLayout ? 'stats-page__optimizer-wrap--pinned' : ''}`} ref={optimizerWrapRef}>
        <div className="stats-page__head-actions">
          <button className="capture-page__back capture-page__back--danger" onClick={() => setResetOpen(true)}>초기화</button>
          <button className="capture-page__back capture-page__back--nav" onClick={onGoToCharacters}>← 캐릭터 선택으로</button>
        </div>
        <header className="stats-page__head stats-page__head--spacer" aria-hidden="true">
          <div className="stats-page__head-top">
            <span className="uploader__eyebrow">점수 통계</span>
          </div>
          <h2>상세 정보</h2>
          <p className="uploader__hint">유효 옵션은 노란색으로 표시됩니다.</p>
        </header>
        <aside className="stats-page__optimizer-col" style={sideLayout ? sideLayout.calc : undefined}>
          <MobileSection title="목표 스탯 계산기 - 베타">
          {/* 목표를 넣고 계산하기를 누르면 결과는 넓은 최적화 화면에서 봅니다(돌아가기로 다시 이 화면). */}
          <OptimizerPanel
            mode="input"
            characterId={character?.id}
            onSubmit={onOpenOptimizer}
            echoes={echoes}
            validLabels={validLabels}
            raw={aggregate}
            baseStats={baseStats}
            weaponData={weaponData}
            onUpdateSubStats={onUpdateSubStats}
          />
          </MobileSection>
        </aside>
        {/* 계산기 아래 빈 자리. 넓은 화면에서는 에코 상세 설정 줄과 위·아래 끝을 맞춥니다(sideLayout). */}
        {echoes.length > 0 && (
          <div className="stats-page__odds" style={sideLayout?.odds ?? undefined}>
            <EchoOddsCard echoes={echoes} selectedIndex={selectedEchoIdx} validLabels={validLabels} onSelect={(i) => focusEcho(i, null, false)} />
          </div>
        )}
      </div>
      </div>

      <WeaponPickerModal
        open={weaponModalOpen}
        onClose={() => setWeaponModalOpen(false)}
        onSelect={(id) => { onSetWeapon(id); setWeaponModalOpen(false) }}
        options={weaponOptions}
        recommendedIds={recommendedWeaponIds}
      />
      <EchoComboPickerModal
        open={comboModalOpen}
        onClose={() => setComboModalOpen(false)}
        onSelectPreset={(presetCombo) => { applyEchoPreset(presetCombo); setComboModalOpen(false) }}
        onAddPart={addEchoSetPart}
        presetEntries={presetEntries}
        addableSets={addableSets}
      />
      {mainEchoIds.length > 1 && (
        <MainEchoPickerModal
          open={mainEchoModalOpen}
          onClose={() => setMainEchoModalOpen(false)}
          onSelect={(id) => { onSetMainEchoId(id); setMainEchoModalOpen(false) }}
          mainEchoIds={mainEchoIds}
        />
      )}
      <RetakeModal
        open={retakeOpen}
        title={`에코 ${selectedEchoIdx + 1} 재촬영`}
        onClose={() => setRetakeOpen(false)}
        onSubmit={(file) => onReplaceOne(echoes[selectedEchoIdx].id, file)}
      />

      <ConfirmDialog
        open={resetOpen}
        title="초기화"
        message="누르게 되면 이 캐릭터의 에코 데이터가 초기화되고, 캡처 화면으로 이동합니다."
        confirmLabel="확인"
        cancelLabel="취소"
        onConfirm={() => { setResetOpen(false); onReset() }}
        onCancel={() => setResetOpen(false)}
      />
    </section>
  )
}
