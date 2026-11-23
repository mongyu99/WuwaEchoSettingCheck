import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FilterGroup } from './EchoBagPage'
import Modal from '../components/Modal'
import CharacterPicker from '../components/CharacterPicker'
import { applyCostToMainStats } from '../config/echoMainStats'
import { getEchoCost } from '../utils/ocr'
import { scoreValidStats } from '../utils/echoScore'
import { getValidOptions } from '../config/characterValidOptions'
import './LiveEchoCheckPage.css'
import './EchoBagPage.css'
import { CHARACTERS } from '../config/characters'
import { ECHO_SETS, getEchoSet } from '../config/echoSets'
import { describeCombo, getCharacterEchoCombos } from '../config/characterEchoSets'
import { getMainEchoIdForCombo } from '../config/echoSetMainEchoes'
import { bagItemAsEcho, buildStatTotals, comboFromPicks, diffTotals, finalStats } from '../utils/statCompare'
import { getCharacterBaseStats } from '../config/characterBaseStats'
import { getWeapon } from '../config/weapons'
import { weaponBonusesAt } from '../utils/weaponRank'
import { assetPath } from '../config/assetPath'
import { gradeOf } from '../utils/echoScore'
import { loadBag } from '../utils/bagStore'
import { LAYOUTS, buildForCharacter } from '../utils/characterBuild'
import './CharacterRecommendPage.css'

/** 추천 칸(가방 에코)을 빌드 체크 에코 모양으로 봅니다(메인 옵션은 고정 수치 줄까지). */
const pickAsEcho = (pick) => ({
  cost: Number(pick.item.cost),
  mainStats: applyCostToMainStats([], Number(pick.item.cost), pick.item.main?.label),
  subStats: pick.item.subStats,
})

/** 같은 에코인지 비교용: 코스트 + 메인 옵션 + 서브 옵션(순서 무관). */
const echoSignature = (echo) =>
  [
    getEchoCost(echo),
    echo.mainStats?.[0]?.label,
    echo.mainStats?.[0]?.valueText,
    ...echo.subStats.map((s) => `${s.label}=${s.valueText}`).sort(),
  ].join('|')

/** 캐릭터를 아직 안 골랐거나 맞는 에코가 없을 때도 화면 모양(요약 · 4-3-3-1-1 빈 자리 · 스탯 칸)은 그대로 보여 줍니다. */
function EmptyBuild({ title, note, layout = [4, 3, 3, 1, 1] }) {
  return (
    <>
      <div className="char-rec__summary">
        <img className="char-rec__grade" src={assetPath('grades/none.png')} alt="" />
        <div>
          <strong>{title}</strong>
          <small>{layout.join('-')} 코스트</small>
        </div>
      </div>
      <p className="char-rec__warn">{note}</p>
      <div className="char-rec__body">
        <ol className="char-rec__picks">
          {layout.map((cost, i) => (
            <li key={i} className="char-rec__pick char-rec__pick--empty">
              <span className="char-rec__thumb" />
              <div className="char-rec__info">
                <span className="char-rec__tags">
                  <em>{cost}코</em>
                </span>
                <strong>비어 있음</strong>
              </div>
            </li>
          ))}
        </ol>
        <section className="char-rec__stats">
          <h3>적용하면 바뀌는 스탯</h3>
          <p className="uploader__hint">조합이 나오면 지금 에코와 비교해 보여 줘요.</p>
        </section>
      </div>
    </>
  )
}

/** 캐릭터 추천: 에코 가방 정리로 모은 에코 중에서 캐릭터마다 끼울 5개 조합을 골라 줍니다. */
export default function CharacterRecommendPage({ initialCharacterId = null, onGoToEchoBag, onReplaceEchoes, characterEchoes = {}, characterData = {} }) {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [characterId, setCharacterId] = useState(initialCharacterId)
  // 세트 필터: 아무것도 안 고르면 캐릭터 추천 세트, 고르면 그 세트의 에코만 씁니다.
  const [filterOpen, setFilterOpen] = useState(false)
  const [pickedSets, setPickedSets] = useState([])
  // 코스트 배치: 4-3-3-1-1(기본) ↔ 4-4-1-1-1
  const [layoutKey, setLayoutKey] = useState('43311')
  const togglePickedSet = (id) => setPickedSets((list) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id]))
  const customSets = pickedSets.length > 0 ? pickedSets : null

  useEffect(() => {
    loadBag()
      .then(setItems)
      .catch((e) => console.error('가방 정리 기록을 불러오지 못했어요.', e))
      .finally(() => setLoaded(true))
  }, [])

  const characters = useMemo(() => CHARACTERS.filter((c) => !c.upcoming), [])
  const character = characters.find((c) => c.id === characterId) ?? null
  const build = useMemo(
    () => (character ? buildForCharacter(character, items, { setIds: customSets, layoutKey }) : null),
    [character, items, customSets, layoutKey],
  )
  // 가방에 있는 세트만 고를 수 있게 보여 줍니다.
  const bagSetIds = useMemo(() => Object.keys(ECHO_SETS).filter((id) => items.some((i) => i.setId === id)), [items])
  const grade = build ? gradeOf(build.total) : null

  // 적용하면 바뀌는 스탯: 캐릭터 빌드 체크에 저장한 지금 에코와 추천 조합을 비교합니다(무기·기본 스탯은 같아서 뺌).
  const statRows = useMemo(() => {
    if (!character || !build) return null
    const current = characterEchoes[character.id] ?? []
    const rec = characterData[character.id]
    const currentCombo = rec?.echoParts ?? getCharacterEchoCombos(character.id)?.[0] ?? []
    const before = current.length
      ? buildStatTotals({
          echoes: current,
          element: character.element,
          combo: currentCombo,
          mainEchoId: rec?.mainEchoId ?? getMainEchoIdForCombo(currentCombo),
          characterId: character.id,
        })
      : null
    const picked = build.picks.filter((p) => p.item)
    const after = buildStatTotals({
      echoes: picked.map((p) => bagItemAsEcho(p.item)),
      element: character.element,
      combo: comboFromPicks(picked),
      mainEchoId: build.mainMissing ? null : build.mainEchoId,
      characterId: character.id,
    })
    return { hasCurrent: !!before, rows: diffTotals(before, after) }
  }, [character, build, characterEchoes, characterData])

  // 세트 필터 칩(필터 서랍 안에 들어갑니다).
  const setFilter = (
    <FilterGroup
      title="세트"
      hint="고른 세트의 에코만 사용 (안 고르면 캐릭터 추천 세트)"
      options={bagSetIds}
      format={(id) => (
        <>
          {ECHO_SETS[id].icon && <img src={ECHO_SETS[id].icon} alt="" />}
          {ECHO_SETS[id].name}
        </>
      )}
      selected={pickedSets}
      onToggle={togglePickedSet}
    />
  )


  // 교체 팝업: 슬롯마다 기존 에코 / 추천 에코를 나란히 보여 주고, 체크한 슬롯만 바꿉니다.
  // 기존 에코를 코스트 높은 순으로 줄 세워 추천(메인 → 4코 → 3코 → 1코)과 같은 순서로 맞춥니다.
  const [replaceRows, setReplaceRows] = useState(null)
  const openReplace = () => {
    const current = [...(characterEchoes[character.id] ?? [])].sort((a, b) => Number(getEchoCost(b) ?? 0) - Number(getEchoCost(a) ?? 0))
    setReplaceRows(
      build.picks.map((pick, i) => {
        const before = current[i] ?? null
        // 이미 같은 에코를 끼고 있으면(메인·서브 옵션이 모두 같음) 바꿀 필요가 없어서 체크하지 않습니다.
        const same = !!pick.item && !!before && echoSignature(before) === echoSignature(pickAsEcho(pick))
        return { before, pick: pick.item ? pick : null, same, checked: !!pick.item && !same }
      }),
    )
  }
  const toggleReplace = (i) => setReplaceRows((rows) => rows.map((r, j) => (j === i ? { ...r, checked: !r.checked } : r)))
  const applyReplace = () => {
    const echoes = replaceRows
      .map((r) =>
        r.checked && r.pick
          ? {
              id: `bag-${r.pick.item.key}`,
              previewUrl: null,
              cost: Number(r.pick.item.cost),
              mainStats: applyCostToMainStats([], Number(r.pick.item.cost), r.pick.item.main?.label),
              subStats: r.pick.item.subStats.map((s, k) => ({ id: `stat-${k}`, label: s.label, valueText: s.valueText })),
              failed: false,
            }
          : r.before,
      )
      .filter(Boolean)
    onReplaceEchoes(character, echoes)
    setReplaceRows(null)
  }
  // 교체 팝업의 에코 한 칸: 코스트·메인 옵션·점수, 아래에 서브 옵션 칩(이 캐릭터에게 유효한 옵션은 강조).
  const validLabels = character ? getValidOptions(character.id) : []
  // 교체 팝업 오른쪽: 지금 체크 상태로 바꾸면 실제 스탯(기본 스탯·무기 포함)이 얼마나 바뀌는지.
  // 세트 효과는 5자리를 모두 바꾸면 추천 조합의 세트로, 일부만 바꾸면 빌드 체크에서 고른 세트 그대로 봅니다.
  // 메인 에코는 메인 자리를 바꾸고 그 에코가 가방에 있을 때만 추천 메인 에코로 봅니다.
  const replaceStats = useMemo(() => {
    if (!replaceRows || !character || !build) return null
    const rec = characterData[character.id]
    const currentCombo = rec?.echoParts ?? getCharacterEchoCombos(character.id)?.[0] ?? []
    const currentMain = rec?.mainEchoId ?? getMainEchoIdForCombo(currentCombo)
    const allReplaced = replaceRows.every((r) => r.checked)
    const mainReplaced = replaceRows.some((r) => r.checked && r.pick?.isMain)
    const loadout = {
      baseStats: getCharacterBaseStats(character.id),
      weapon: getWeapon(rec?.weapon),
      weaponRank: rec?.weaponRank ?? 1,
      weaponBonusesAt,
    }
    const totals = (echoes, combo, mainEchoId) =>
      finalStats(buildStatTotals({ echoes, element: character.element, combo, mainEchoId, characterId: character.id }), loadout)
    const before = totals(replaceRows.map((r) => r.before).filter(Boolean), currentCombo, currentMain)
    const after = totals(
      replaceRows.map((r) => (r.checked && r.pick ? pickAsEcho(r.pick) : r.before)).filter(Boolean),
      allReplaced ? comboFromPicks(build.picks.filter((p) => p.item)) : currentCombo,
      mainReplaced && !build.mainMissing ? build.mainEchoId : currentMain,
    )
    return before
      .map((b, i) => ({ ...b, after: after[i].value, diff: after[i].value - b.value }))
      .filter((r) => Math.abs(r.value) >= 0.05 || Math.abs(r.after) >= 0.05)
  }, [replaceRows, character, build, characterData])

  const echoCard = (echo) => {
    if (!echo) return <span className="char-rec__rc-empty">비어 있음</span>
    const { total } = scoreValidStats(echo.subStats, validLabels)
    return (
      <>
        <span className="char-rec__rc-head">
          <em>{getEchoCost(echo)}코</em>
          <strong>
            {echo.mainStats?.[0]?.label} {echo.mainStats?.[0]?.valueText}
          </strong>
          <b>{total.toFixed(1)}</b>
        </span>
        <span className="char-rec__rc-subs">
          {echo.subStats.map((s) => (
            <span key={s.label} className={validLabels.includes(s.label) ? 'char-rec__rc-sub--valid' : ''}>
              {s.label.replace(/%$/, '')} <i>{s.valueText}</i>
            </span>
          ))}
        </span>
      </>
    )
  }

  return (
    <section className="char-rec">
      <header>
        <span className="uploader__eyebrow">추천 세팅</span>
        <h2>내 가방 에코로 캐릭터 세팅 짜기</h2>
        <p className="uploader__hint">
          에코 가방에 모은 에코 중에서, 캐릭터의 메인 에코와 추천 세트를 맞추고 유효 옵션 점수가 가장 높은 5개를 골라드려요.
        </p>
      </header>

      {!loaded ? (
        <p className="uploader__hint">불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="char-rec__empty">
          <p className="uploader__hint">아직 가방에 모은 에코가 없어요. 에코 가방에서 먼저 에코를 모아 주세요.</p>
          {onGoToEchoBag && (
            <button type="button" className="btn btn--primary" onClick={onGoToEchoBag}>
              에코 가방으로 가기
            </button>
          )}
        </div>
      ) : (
        <div className="char-rec__layout char-rec__layout--single">
          <div className="char-rec__result">
            <div className="char-rec__toolbar">
              {/* 캐릭터 고르기: 가방 정리·실시간 체크와 같은 선택 팝업 */}
              <CharacterPicker value={character} onChange={(c) => setCharacterId(c?.id ?? null)} />
              <div className="char-rec__layout-toggle" role="radiogroup" aria-label="코스트 배치">
                {[
                  ['43311', '4-3-3-1-1'],
                  ['44111', '4-4-1-1-1'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={layoutKey === key}
                    className={layoutKey === key ? 'char-rec__layout-toggle--on' : ''}
                    onClick={() => setLayoutKey(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {character && (
                <>
                <span className="char-rec__set-note">
                  {customSets ? `고른 세트만 사용 (${customSets.length}개)` : '캐릭터 추천 세트 사용'}
                </span>
                <button
                  type="button"
                  className={`echo-bag__filter-btn ${customSets ? 'echo-bag__filter-btn--on' : ''}`}
                  onClick={() => setFilterOpen(true)}
                >
                  필터{customSets && <b>{customSets.length}</b>}
                </button>
                </>
              )}
            </div>
            {!character ? (
              <EmptyBuild layout={LAYOUTS[layoutKey]} title="캐릭터를 골라 주세요" note="위의 캐릭터 버튼을 누르면 가방 에코로 5개 조합을 짜 드려요." />
            ) : !build ? (
              <EmptyBuild layout={LAYOUTS[layoutKey]} title={`${character.name} · 0점`} note={`${character.name}에게 맞는 메인 옵션의 에코가 가방에 없어요.`} />
            ) : (
              <>
                <div className="char-rec__summary">
                  <img className="char-rec__grade" src={assetPath(`grades/${grade.icon}.png`)} alt={grade.label} />
                  <div>
                    <strong>
                      {character.name} · {build.total.toFixed(1)}점
                    </strong>
                    <small>
                      {build.layout.join('-')} 코스트
                      {customSets
                        ? ` · 고른 세트: ${customSets.map((id) => getEchoSet(id)?.name ?? id).join(', ')}`
                        : build.combo.length > 0 && ` · ${describeCombo(build.combo)}`}
                      {(customSets ?? build.combo.map((p) => p.setId)).map((id) =>
                        getEchoSet(id)?.icon ? (
                          <img key={id} className="char-rec__set-icon" src={getEchoSet(id).icon} alt={getEchoSet(id).name} title={getEchoSet(id).name} />
                        ) : null,
                      )}
                    </small>
                  </div>
                  {onReplaceEchoes && (
                    <button type="button" className="btn btn--primary char-rec__replace-btn" onClick={openReplace}>
                      교체
                    </button>
                  )}
                </div>

                {!customSets && !build.setsMet && <p className="char-rec__warn">추천 세트 에코가 모자라요.</p>}

                {/* 왼쪽: 추천 에코 5개, 오른쪽: 적용하면 바뀌는 스탯 */}
                <div className="char-rec__body">
                <ol className="char-rec__picks">
                  {build.picks.map(({ item, score, rows, isMain, empty, cost }, idx) =>
                    empty ? (
                      <li key={`empty-${idx}`} className="char-rec__pick char-rec__pick--empty">
                        <span className="char-rec__thumb" />
                        <div className="char-rec__info">
                          <span className="char-rec__tags">
                            <em>{cost}코</em>
                          </span>
                          <strong>이 자리에 맞는 에코가 가방에 없어요</strong>
                        </div>
                      </li>
                    ) : (
                    <li key={item.key} className={`char-rec__pick ${isMain ? 'char-rec__pick--main' : ''}`}>
                      {item.thumbnail ? <img className="char-rec__thumb" src={item.thumbnail} alt="" /> : <span className="char-rec__thumb" />}
                      <div className="char-rec__info">
                        <span className="char-rec__tags">
                          {isMain && <b>메인 에코</b>}
                          <em>{item.cost}코</em>
                          {getEchoSet(item.setId)?.name ?? '세트 모름'}
                        </span>
                        <strong>
                          {item.main?.label} {item.main?.valueText}
                        </strong>
                        <span className="char-rec__subs">
                          {item.subStats.map((s) => (
                            <span key={s.label} className={rows.some((r) => r.label === s.label) ? 'char-rec__sub--valid' : ''}>
                              {s.label} {s.valueText}
                            </span>
                          ))}
                        </span>
                      </div>
                      {/* 가방 정리와 같은 등급 아이콘 + 점수(에코 하나 점수 × 5를 5개 합계 등급표에 대 봄) */}
                      <span className="char-rec__score">
                        <img src={assetPath(`grades/${gradeOf(score * 5).icon}.png`)} alt={gradeOf(score * 5).label} />
                        {score.toFixed(1)}
                      </span>
                    </li>
                    ),
                  )}
                </ol>

                {statRows && (
                  <section className="char-rec__stats">
                    <h3>적용하면 바뀌는 스탯</h3>
                    <p className="uploader__hint">
                      {'캐릭터 빌드 체크에 저장한 지금 에코와 비교해요.'}
                    </p>
                    <table>
                      <thead>
                        <tr>
                          <th>스탯</th>
                          {statRows.hasCurrent && <th>지금</th>}
                          <th>추천</th>
                          {statRows.hasCurrent && <th>차이</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {statRows.rows.map((r) => (
                          <tr key={r.label}>
                            <td>{r.label}</td>
                            {statRows.hasCurrent && <td>{r.unit ? `${r.before.toFixed(1)}%` : Math.round(r.before)}</td>}
                            <td>{r.unit ? `${r.after.toFixed(1)}%` : Math.round(r.after)}</td>
                            {statRows.hasCurrent && (
                              <td className={r.diff > 0.05 ? 'char-rec__up' : r.diff < -0.05 ? 'char-rec__down' : 'char-rec__same'}>
                                {Math.abs(r.diff) < 0.05 ? '-' : `${r.diff > 0 ? '+' : ''}${r.unit ? `${r.diff.toFixed(1)}%` : Math.round(r.diff)}`}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 세트 필터 서랍: 가방 정리의 필터와 같은 모양으로 오른쪽에서 나옵니다. */}
      {createPortal(
        <div className={`echo-bag__drawer ${filterOpen ? 'echo-bag__drawer--open' : ''}`} aria-hidden={!filterOpen}>
          <div className="echo-bag__drawer-backdrop" onClick={() => setFilterOpen(false)} />
          <aside className="echo-bag__drawer-panel" role="dialog" aria-label="세트 필터">
            <header className="echo-bag__drawer-head">
              <h3>필터</h3>
              <button type="button" className="echo-bag__drawer-reset" onClick={() => setPickedSets([])} disabled={pickedSets.length === 0}>
                초기화
              </button>
              <button type="button" className="modal__close" onClick={() => setFilterOpen(false)} aria-label="닫기">
                ×
              </button>
            </header>
            <div className="echo-bag__drawer-body">{setFilter}</div>
            <footer className="echo-bag__drawer-foot">
              <button type="button" className="btn btn--primary" onClick={() => setFilterOpen(false)}>
                적용
              </button>
            </footer>
          </aside>
        </div>,
        document.body,
      )}

      <Modal wide open={!!replaceRows} title={character ? `${character.name} 에코 교체` : '에코 교체'} onClose={() => setReplaceRows(null)}>
        {replaceRows && (
          <>
          {/* 안내는 두 칸 위에 두고, 왼쪽 목록과 오른쪽 스탯이 같은 높이에서 시작하게 합니다. */}
          <p className="uploader__hint char-rec__replace-hint">체크한 자리만 바꿔요. 캐릭터 빌드 체크에 저장된 에코가 바뀌어요.</p>
          <div className="char-rec__replace-wrap">
          <div className="char-rec__replace">
            <div className="char-rec__replace-head">
              <span />
              <span>기존</span>
              <span />
              <span>변경</span>
            </div>
            {replaceRows.map((r, i) => (
              <label
                key={i}
                className={`char-rec__replace-row ${!r.pick || r.same ? 'char-rec__replace-row--off' : ''} ${r.checked ? 'char-rec__replace-row--on' : ''}`}
              >
                <input type="checkbox" checked={r.checked} disabled={!r.pick || r.same} onChange={() => toggleReplace(i)} />
                <span className="char-rec__replace-cell">{echoCard(r.before)}</span>
                <span className="char-rec__replace-arrow" aria-hidden="true">
                  →
                </span>
                <span className="char-rec__replace-cell">
                  {r.same ? (
                    <span className="char-rec__rc-empty">지금과 같은 에코</span>
                  ) : r.pick ? (
                    echoCard(pickAsEcho(r.pick))
                  ) : (
                    <span className="char-rec__rc-empty">추천 에코 없음</span>
                  )}
                </span>
              </label>
            ))}
            <div className="char-rec__replace-foot">
              <button type="button" className="btn btn--ghost" onClick={() => setReplaceRows(null)}>
                취소
              </button>
              <button type="button" className="btn btn--primary" onClick={applyReplace} disabled={!replaceRows.some((r) => r.checked)}>
                {replaceRows.filter((r) => r.checked).length}개 교체
              </button>
            </div>
          </div>
          {replaceStats && (
            <aside className="char-rec__replace-stats">
              <h4>바꾸면 실제 스탯</h4>
              <small>캐릭터 기본 스탯·무기 포함, 체크한 대로 바로 계산</small>
              <table>
                <thead>
                  <tr>
                    <th>스탯</th>
                    <th>지금</th>
                    <th>바꾸면</th>
                    <th>차이</th>
                  </tr>
                </thead>
                <tbody>
                  {replaceStats.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td className="char-rec__rs-num">{r.whole ? Math.floor(r.value).toLocaleString() : `${r.value.toFixed(1)}%`}</td>
                      <td className="char-rec__rs-num">
                        <strong>{r.whole ? Math.floor(r.after).toLocaleString() : `${r.after.toFixed(1)}%`}</strong>
                      </td>
                      <td className={r.diff > 0.05 ? 'char-rec__up' : r.diff < -0.05 ? 'char-rec__down' : 'char-rec__same'}>
                        {Math.abs(r.diff) < 0.05
                          ? '-'
                          : `${r.diff > 0 ? '+' : ''}${r.whole ? Math.round(r.diff).toLocaleString() : `${r.diff.toFixed(1)}%`}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </aside>
          )}
          </div>
          </>
        )}
      </Modal>
    </section>
  )
}
