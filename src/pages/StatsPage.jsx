import { useState } from 'react'
import { getValidOptions } from '../config/characterValidOptions'
import { computeEchoScore, buildDisplayBreakdown, scoreToTier, tierColor, MAX_SCORE_PER_ECHO } from '../utils/scoring'
import { SUB_STAT_OPTIONS, formatSubStatValue } from '../config/subStatOptions'
import ConfirmDialog from '../components/ConfirmDialog'
import InfoTooltip from '../components/InfoTooltip'
import './StatsPage.css'

const SCORE_TIER_ROWS = [
    ['0~9', 'F'],
    ['10~19', 'E'],
    ['20~29', 'D'],
    ['30~39', 'C'],
    ['40~49', 'B'],
    ['50~59', 'A'],
    ['60', 'L'],
]

const TIER_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7]

export default function StatsPage({ echoes, character, onGoToCharacters, onReset }) {
    const [resetOpen, setResetOpen] = useState(false)
    const validLabels = getValidOptions(character?.id)
    const scores = echoes.map((e) => computeEchoScore(e.subStats, validLabels).score)
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const tier = scores.length ? scoreToTier(avgScore) : null

    return (
        <section className="stats-page">
            <header className="stats-page__head">
                <div className="stats-page__head-top">
                    <span className="uploader__eyebrow">점수 통계</span>
                    <div className="stats-page__head-actions">
                        <button className="capture-page__back" onClick={() => setResetOpen(true)}>
                            초기화
                        </button>
                        <button className="capture-page__back" onClick={onGoToCharacters}>
                            ← 캐릭터 선택으로
                        </button>
                    </div>
                </div>
                <h2>캐릭터의 유효 옵션 기준으로 점수를 계산합니다</h2>
                <p className="uploader__hint">
                    공격력·방어력(플랫)은 단계마다 1점, 그 외 유효 옵션은 단계마다 1.5점입니다. 노란색 항목만
                    유효 옵션이며 점수에 반영되고, 회색 항목은 참고용으로만 표시됩니다.
                </p>
            </header>

            {echoes.length > 0 && (
                <div className="stats-summary">
                    <div className="stats-summary__row">
                        <div className="stats-summary__item">
                            <span className="stats-summary__label">평균 점수</span>
                            <span className="stats-summary__score">{avgScore.toFixed(1)}점</span>
                        </div>
                        <div className="stats-summary__item">
                            <span className="stats-summary__label">
                                달성 티어
                                <InfoTooltip>
                                    <table>
                                        <thead><tr><th>점수</th><th>티어</th></tr></thead>
                                        <tbody>
                                            {SCORE_TIER_ROWS.map(([range, t]) => (
                                                <tr key={t}>
                                                    <td>{range}</td>
                                                    <td style={{ color: tierColor(t), fontWeight: 700 }}>{t}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </InfoTooltip>
                            </span>
                            <span className="stats-summary__tier" style={{ color: tierColor(tier) }}>{tier}</span>
                        </div>
                        <div className="stats-summary__item">
                            <span className="stats-summary__label">
                                단계 기준
                                <InfoTooltip>
                                    <table className="tier-lookup-table">
                                        <thead>
                                            <tr>
                                                <th>단계</th>
                                                {validLabels.map((label) => <th key={label}>{label}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {validLabels.length === 0 && (
                                                <tr><td>설정된 유효 옵션 없음</td></tr>
                                            )}
                                            {validLabels.length > 0 && TIER_INDEXES.map((i) => (
                                                <tr key={i}>
                                                    <td className="tier-lookup-table__label">{i + 1}단계</td>
                                                    {validLabels.map((label) => {
                                                        const options = SUB_STAT_OPTIONS[label] ?? []
                                                        return (
                                                            <td key={label}>
                                                                {options[i] !== undefined ? formatSubStatValue(label, options[i]) : '-'}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </InfoTooltip>
                            </span>
                            <span className="stats-summary__hint">이 수치가 몇 단계인지</span>
                        </div>
                    </div>
                </div>
            )}

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
                    <h4>유효 옵션</h4>
                    <ul className="stats-page__valid-list">
                        {validLabels.length === 0 && <li className="echo-panel__empty">설정된 유효 옵션 없음</li>}
                        {validLabels.map((label) => (
                            <li key={label}>{label}</li>
                        ))}
                    </ul>
                </aside>

                <div className="stats-page__echo-grid">
                    {echoes.map((echo, idx) => {
                        const breakdown = buildDisplayBreakdown(echo.subStats, validLabels)
                        const { score } = computeEchoScore(echo.subStats, validLabels)
                        return (
                            <div className="echo-score-card" key={echo.id}>
                                <div className="echo-score-card__top">
                                    <span className="echo-score-card__badge">에코 {idx + 1}</span>
                                    <span className="echo-score-card__score">
                                        {score}점 <span className="echo-score-card__max">/ {MAX_SCORE_PER_ECHO}</span>
                                    </span>
                                </div>
                                <ul className="echo-score-card__stats">
                                    {breakdown.length === 0 && <li className="echo-panel__empty">인식된 서브 스탯 없음</li>}
                                    {breakdown.map((b, i) => (
                                        <li key={i} className={`stat-line ${b.valid ? 'stat-line--valid' : 'stat-line--muted'}`}>
                                            <span className="stat-line__label">{b.label}</span>
                                            <span className="stat-line__sep">|</span>
                                            <span className="stat-line__value">{b.valueText}</span>
                                            <span className="stat-line__sep">|</span>
                                            <span className="stat-line__grade">{b.tier > 0 ? `${b.tier}단계` : '-'}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            </div>

            <ConfirmDialog
                open={resetOpen}
                title="초기화"
                message="누르게 되면 지금까지 저장한 데이터가 초기화됩니다."
                confirmLabel="예"
                cancelLabel="아니요"
                onConfirm={() => {
                    setResetOpen(false)
                    onReset()
                }}
                onCancel={() => setResetOpen(false)}
            />
        </section>
    )
}
