import React from 'react'
import { useGameStore } from '../store/gameStore'

const MEDALS = ['🥇', '🥈', '🥉']

export function HistoryScreen({ onNewGame, onShowSetup, toast }) {
  const { gameName, history, getTotals, resetBoard } = useGameStore()
  const totals = getTotals()
  const winner = totals[0]

  async function handleNewGame() {
    const ok = await resetBoard()
    if (ok) {
      toast('Da tao van moi')
      onNewGame()
    } else {
      toast('Khong the tao van moi')
    }
  }

  return (
    <div className="screen">
      <div className="hero-header">
        <div className="hero-brand">
          <div className="hero-dice">🎲</div>
          <div>
            <h1 className="hero-title">Board Game Score Tracker</h1>
            <p className="hero-subtitle">ghi diem euro games</p>
          </div>
        </div>
      </div>

      <div className="demo-tabs">
        <button className="demo-tab" onClick={onShowSetup}>✏️ Van moi</button>
        <button className="demo-tab active">📜 Lich su ({history.length})</button>
      </div>

      <div className="screen-inner demo-layout">
        {winner ? (
          <section className="paper-card result-card">
            <div className="result-title">🏆 Ket qua</div>
            <div className="result-subtitle">{gameName || 'Khong ten'}</div>

            <div className="podium-grid">
              {totals.slice(0, 3).map((player, index) => (
                <div key={player.id} className={`podium-slot podium-${index + 1}`}>
                  <div className="podium-name">{player.name}</div>
                  <div className="podium-score">{player.total}</div>
                  <div className="podium-medal">{MEDALS[index]}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {totals.length > 0 ? (
          <section className="paper-card compact-card">
            <div className="card-heading">📋 Bang xep hang</div>
            <div className="ranking-list">
              {totals.map((player, index) => (
                <div key={player.id} className="ranking-row">
                  <span className="rank-badge">{index + 1}</span>
                  <span className="player-dot-inline" style={{ background: player.color }} />
                  <span className="ranking-name">{player.name}</span>
                  <strong>{player.total} pts</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="history-headline">{history.length} van da choi</div>
        <div className="history-list">
          {history.map((entry) => (
            <article key={entry.id} className="paper-card history-card">
              <div className="history-title-row">
                <div className="history-title">🎲 {entry.gameName}</div>
                {entry.winner ? (
                  <div className="winner-pill">🏆 {entry.winner.name}</div>
                ) : null}
              </div>
              <div className="history-meta">{entry.playedAt} · {entry.playerCount} nguoi choi</div>
              <div className="history-player-grid">
                {entry.players.map((player) => (
                  <div key={player.id} className="history-player-pill">
                    <span className="player-dot-inline" style={{ background: player.color }} />
                    <span>{player.name}: {player.total}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <button className="btn-primary demo-save new-game-btn" onClick={handleNewGame}>
          🎲 Van moi
        </button>
      </div>
    </div>
  )
}
