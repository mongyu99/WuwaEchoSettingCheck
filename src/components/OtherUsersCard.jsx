import { CHARACTERS } from '../config/characters'
import { getValidOptions } from '../config/characterValidOptions'
import { scoreValidStats } from '../utils/echoScore'
import { getEchoCost } from '../utils/ocr'
import { mainFits, usesSet } from '../utils/echoRecommend'
import './OtherUsersCard.css'

const MAX_ROWS = 6

/**
 * 에코 체크 오른쪽 칸: "이 에코를 다른 캐릭터도 쓸 수 있을까요?"
 * 지금 비교 중인 캐릭터(exclude)를 빼고, 이 세트를 쓰는 캐릭터들에게 이 에코가 얼마나 쓸 만한지 보여 줍니다.
 * 그 캐릭터 에코를 등록해 뒀으면 같은 코스트 중 가장 낮은 자리와 점수를 비교해 "교체 이득"까지 알려 줍니다.
 * 강화하다 실패한 에코를 갈기 전에, 다른 캐릭터가 쓸 꿀에코인지 한 번 더 보게 하려는 칸입니다.
 */
export default function OtherUsersCard({ subStats, setId, mainLabel, cost, characterEchoes = {}, excludeId, onPick, compact = false }) {
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
      return {
        character,
        total,
        validCount,
        mainOk: !mainLabel || mainFits(character, mainLabel),
        registered: mine.length > 0,
        gain: weakest ? total - weakest.score : null,
        slot: weakest?.i ?? null,
      }
    })
    // 메인 옵션이 안 맞는 캐릭터는 뒤로, 그 안에서는 교체 이득 → 점수 순
    .sort((a, b) => b.mainOk - a.mainOk || (b.gain ?? -Infinity) - (a.gain ?? -Infinity) || b.total - a.total)
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
            <li key={r.character.id} className={r.gain > 0 && r.mainOk ? 'other-users__row--good' : ''}>
              <button type="button" onClick={() => onPick?.(r.character)} title={`${r.character.name} 기준으로 비교하기`}>
                {r.character.image ? <img src={r.character.image} alt="" /> : <span className="other-users__face" />}
                <div className="other-users__info">
                  <strong>{r.character.name}</strong>
                  <small>
                    유효 {r.validCount}/{subStats.length} · {r.total.toFixed(1)}점
                    {!r.mainOk && ' · 메인 옵션 안 맞음'}
                  </small>
                </div>
                <span className="other-users__gain">
                  {r.gain === null ? (
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
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
