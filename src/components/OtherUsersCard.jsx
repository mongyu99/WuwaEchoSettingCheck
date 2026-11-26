import { useState } from 'react'
import { thumbFallback } from '../utils/thumbFallback'
import { CHARACTERS } from '../config/characters'
import { getValidOptions } from '../config/characterValidOptions'
import { scoreValidStats } from '../utils/echoScore'
import { getEchoCost } from '../utils/ocr'
import { mainFits, usesSet } from '../utils/echoRecommend'
import { findSameEcho } from '../utils/echoIdentity'
import './OtherUsersCard.css'

const MAX_ROWS = 6

/**
 * 에코 체크 오른쪽 칸: "이 에코를 다른 캐릭터도 쓸 수 있을까요?"
 * 지금 비교 중인 캐릭터(exclude)를 빼고, 이 세트를 쓰는 캐릭터들에게 이 에코가 얼마나 쓸 만한지 보여 줍니다.
 * 그 캐릭터 에코를 등록해 뒀으면 같은 코스트 중 가장 낮은 자리와 점수를 비교해 "교체 이득"까지 알려 줍니다.
 * 줄을 누르면 캐릭터가 바뀌지 않고, 그 자리에서 어느 에코와 바꾸면 좋은지·점수 변화를 펼쳐 보여 줍니다.
 * 강화하다 실패한 에코를 갈기 전에, 다른 캐릭터가 쓸 꿀에코인지 한 번 더 보게 하려는 칸입니다.
 */
export default function OtherUsersCard({ subStats, setId, mainLabel, cost, characterEchoes = {}, excludeId, compact = false }) {
  const [openId, setOpenId] = useState(null) // 눌러서 펼친 캐릭터(어느 자리와 바꾸면 점수가 얼마나 바뀌는지)
  // compact: PiP 작은 창용(설명 줄을 빼고 3명까지만)
  const cls = `other-users ${compact ? 'other-users--compact' : ''}`
  if (!subStats?.length) {
    return (
      <section className={cls}>
        <h3>이 에코, 다른 캐릭터도 쓸 수 있을까요?</h3>
        <p className="uploader__hint">에코를 인식하면 같은 세트 캐릭터를 찾아 드려요.</p>
      </section>
    )
  }
  if (!setId) {
    return (
      <section className={cls}>
        <h3>이 에코, 다른 캐릭터도 쓸 수 있을까요?</h3>
        <p className="uploader__hint">세트를 못 읽었어요. 인식한 에코의 [수정]에서 세트를 골라 주세요.</p>
      </section>
    )
  }

  const rows = CHARACTERS.filter((c) => !c.upcoming && c.id !== excludeId && usesSet(c.id, setId))
    .map((character) => {
      const valid = getValidOptions(character.id)
      const { total, validCount } = scoreValidStats(subStats, valid)
      // 등록한 에코가 있으면: 같은 코스트 중 점수가 가장 낮은 자리와 비교(코스트를 모르면 비교 안 함)
      const mine = characterEchoes[character.id] ?? []
      const sameCost = cost ? mine.map((e, i) => ({ i, score: scoreValidStats(e.subStats, valid).total, cost: Number(getEchoCost(e)) })).filter((x) => x.cost === Number(cost)) : []
      const weakest = sameCost.sort((a, b) => a.score - b.score)[0] ?? null
      // 이 캐릭터가 이미 똑같은 옵션의 에코를 끼고 있으면(같은 에코일 가능성이 큼) 교체 이득 대신 "착용 중"으로 보여 줍니다.
      const same = findSameEcho({ cost, mainLabel, subStats }, mine)
      // 이 에코에서 그 캐릭터에게 유효한 서브 옵션
      const hits = subStats.filter((st) => valid.includes(st.label)).map((st) => `${st.label} ${st.valueText}`)
      return {
        character,
        total,
        validCount,
        mainOk: !mainLabel || mainFits(character, mainLabel),
        registered: mine.length > 0,
        gain: weakest ? total - weakest.score : null,
        slot: weakest?.i ?? null,
        slotScore: weakest?.score ?? null,
        same,
        hits,
      }
    })
    // 메인 옵션이 안 맞는 캐릭터는 뒤로, 그 안에서는 교체 이득 → 점수 순
    .sort((a, b) => b.mainOk - a.mainOk || (b.same < 0 ? b.gain ?? -Infinity : -Infinity) - (a.same < 0 ? a.gain ?? -Infinity : -Infinity) || b.total - a.total)
    .slice(0, compact ? 3 : MAX_ROWS)

  return (
    <section className={cls}>
      <h3>이 에코, 다른 캐릭터도 쓸 수 있을까요?</h3>
      {!compact && <p className="other-users__hint">같은 세트를 쓰는 캐릭터예요. 갈기 전에 한 번 봐 주세요.</p>}
      {!cost && <p className="other-users__warn">코스트 미확인 · 교체 이득은 코스트를 알아야 계산돼요.</p>}
      {rows.length === 0 ? (
        <p className="uploader__hint">이 세트를 쓰는 다른 캐릭터가 없어요.</p>
      ) : (
        <ul className="other-users__list">
          {rows.map((r) => (
            <li key={r.character.id} className={`${r.gain > 0 && r.mainOk && r.same < 0 ? 'other-users__row--good' : ''} ${openId === r.character.id ? 'other-users__row--open' : ''}`}>
              <button
                type="button"
                aria-expanded={openId === r.character.id}
                onClick={() => setOpenId((id) => (id === r.character.id ? null : r.character.id))}
              >
                {r.character.image ? <img src={r.character.thumb ?? r.character.image} onError={thumbFallback(r.character)} alt="" /> : <span className="other-users__face" />}
                <div className="other-users__info">
                  <strong>{r.character.name}</strong>
                  <small>
                    유효 {r.validCount}/{subStats.length} · {r.total.toFixed(1)}점
                    {!r.mainOk && ' · 메인 옵션 안 맞음'}
                  </small>
                </div>
                <span className="other-users__gain">
                  {r.same >= 0 ? (
                    <em className="other-users__same">착용 중인 에코와 같음</em>
                  ) : r.gain === null ? (
                    <em>{r.registered ? '같은 코스트 없음' : '세팅 없음'}</em>
                  ) : r.gain > 0 ? (
                    <b>
                      +{r.gain.toFixed(1)}
                      <small>에코 {r.slot + 1}보다</small>
                    </b>
                  ) : (
                    <em>이득 없음</em>
                  )}
                </span>
              </button>
              {openId === r.character.id && (
                <div className="other-users__detail">
                  {r.same >= 0 ? (
                    <p className="other-users__verdict">
                      {r.character.name} 에코 {r.same + 1}와 옵션이 똑같아요. 같은 에코라면 이미 끼고 있는 에코예요.
                    </p>
                  ) : r.gain !== null ? (
                    <>
                      <p className="other-users__swap">
                        <span>
                          에코 {r.slot + 1} ({cost}코)와 바꾸면
                        </span>
                        <strong>
                          {r.slotScore.toFixed(1)} → {r.total.toFixed(1)}
                        </strong>
                        <b className={r.gain > 0 ? 'other-users__up' : 'other-users__down'}>
                          {r.gain > 0 ? '+' : ''}
                          {r.gain.toFixed(1)}
                        </b>
                      </p>
                      <p className="other-users__verdict">
                        {r.gain > 0 ? (r.mainOk ? '바꾸기 추천이에요.' : '점수는 오르지만 메인 옵션이 안 맞아요.') : '지금 에코가 더 좋아서 바꿀 필요가 없어요.'}
                      </p>
                    </>
                  ) : (
                    <p className="other-users__verdict">
                      {r.registered
                        ? `등록한 에코 중 ${cost ?? '?'}코 자리가 없어서 비교할 수 없어요.`
                        : !cost
                          ? '코스트를 알아야 바꿀 자리를 찾을 수 있어요.'
                          : '이 캐릭터의 에코 세팅이 없어서 비교할 수 없어요.'}
                    </p>
                  )}
                  <p className="other-users__hits">
                    유효 옵션: {r.hits.length ? r.hits.join(' · ') : '없음'}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
