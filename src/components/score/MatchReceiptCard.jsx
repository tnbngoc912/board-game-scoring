import React, { forwardRef } from 'react'
import { ScoreGrid } from './ScoreGrid'

const GAME_IMAGE_THEMES = [
  ['#b9d8d4', '#7fb0c8'],
  ['#e2c290', '#a76642'],
  ['#d7b08e', '#71472f'],
  ['#bad2a1', '#54855a'],
  ['#d7c2a4', '#8c613b'],
]

function getGameImageTheme(index) {
  return GAME_IMAGE_THEMES[index % GAME_IMAGE_THEMES.length]
}

function getWinner(match) {
  if (match.winner) return match.winner
  const players = match.players || []
  return [...players].sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0))[0] || null
}

function getTopWinners(match) {
  const players = match.players || []
  if (players.length === 0) return []
  const maxTotal = players.reduce(
    (max, player) => Math.max(max, Number(player.total) || 0),
    Number.NEGATIVE_INFINITY
  )
  if (!Number.isFinite(maxTotal)) return []
  return players.filter((player) => (Number(player.total) || 0) === maxTotal)
}

export const MatchReceiptCard = forwardRef(function MatchReceiptCard(
  { match, memoryDataUrls = [] },
  ref
) {
  if (!match) return null

  const winner = getWinner(match)
  const players = match.players || []
  const maxTotal = players.reduce(
    (max, player) => Math.max(max, Number(player.total) || 0),
    Number.NEGATIVE_INFINITY
  )
  const winningPlayerIds = new Set(
    players
      .filter((player) => (Number(player.total) || 0) === maxTotal)
      .map((player) => player.id)
  )
  const scoreRows = match.scoreRows || []
  const scoringType = match.scoringType || 'COLUMN_BASED'
  const isTotalScoreOnly = scoringType === 'TOTAL_SCORE_ONLY'
  const isWinnerOnly = scoringType === 'WINNER_ONLY'
  const displayedScoreRows = isTotalScoreOnly ? scoreRows.slice(0, 1) : scoreRows

  const memoryImages =
    memoryDataUrls.length > 0
      ? memoryDataUrls
      : (match.imageAttachments || [])
          .filter((image) => image?.url)
          .map((image) => image.url)

  // Dynamic width calculation so all columns are completely visible without horizontal scroll
  const cardWidth = Math.max(390, 104 + players.length * 75)

  return (
    <div
      ref={ref}
      className="screen score-screen history-detail-screen match-receipt-export-card"
      style={{ width: `${cardWidth}px` }}
    >
      {/* 1. Match Summary Strip */}
      <section
        className="match-summary-strip"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="game-card-thumb detail-thumb"
            style={{
              background: `linear-gradient(135deg, ${getGameImageTheme(1).join(', ')})`,
            }}
          >
            {match.thumbnailUrl ? (
              <img
                alt=""
                width={78}
                height={78}
                src={match.thumbnailUrl}
                crossOrigin="anonymous"
                loading="eager"
                decoding="sync"
              />
            ) : (
              <span>{match.gameName?.slice(0, 2).toUpperCase() || 'BG'}</span>
            )}
          </div>
          <div>
            <h2>{match.gameName}</h2>
            <p>{match.playedAt}</p>
          </div>
        </div>

        <div className="match-receipt-brand-badge">
          <div className="brand-name">BGSCORE</div>
          <div className="receipt-tag">BẢNG ĐIỂM</div>
        </div>
      </section>

      {/* 3. Bảng Điểm Scoreboard */}
      {isWinnerOnly ? (
        <section
          className="winner-only-list history-winner-only-card"
          aria-label="Người chơi và người thắng"
        >
          {players.map((player) => {
            const isWin = winner?.id === player.id

            return (
              <div
                key={player.id}
                className={`winner-only-player${isWin ? ' winner' : ''}`}
              >
                <span>{player.name}</span>
                <div
                  className="winner-only-crown-row"
                  aria-label={isWin ? 'Người thắng' : undefined}
                >
                  {isWin ? (
                    <img
                      src="/crown.svg"
                      alt=""
                      width={32}
                      height={28}
                      crossOrigin="anonymous"
                    />
                  ) : null}
                </div>
              </div>
            )
          })}
        </section>
      ) : (
        <section className="score-board history-score-board">
          <ScoreGrid
            players={players}
            rows={displayedScoreRows}
            mode={isTotalScoreOnly ? 'TOTAL_SCORE_ONLY' : 'COLUMN_BASED'}
            stickyHeader={false}
            showTotal={!isTotalScoreOnly}
            winningPlayerIds={winningPlayerIds}
            editable={false}
          />
        </section>
      )}

      {/* 4. Note Ghi Chú */}
      {match.description ? (
        <div className="history-detail-note">{match.description}</div>
      ) : null}

      {/* 5. Hình Ảnh Kỷ Niệm */}
      {memoryImages.length ? (
        <section className="history-memory-section" aria-label="Hình ảnh kỉ niệm">
          <h2>HÌNH ẢNH KỶ NIỆM</h2>
          <div className="history-memory-grid">
            {memoryImages.map((url, index) => (
              <div
                key={index}
                className="history-memory-card"
                aria-label={`Hình ảnh kỉ niệm ${index + 1}`}
              >
                <img
                  src={url}
                  alt={`Hình ảnh kỉ niệm ${index + 1}`}
                  loading="eager"
                  decoding="sync"
                  crossOrigin="anonymous"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
})
