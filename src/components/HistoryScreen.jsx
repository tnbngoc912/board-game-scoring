import React, { useMemo, useState } from 'react'
import { useGameStore } from '../store/gameStore'

const MEDALS = ['🥇', '🥈', '🥉']

export function HistoryScreen({ onNewGame, onShowSetup, toast }) {
  const [selectedGameName, setSelectedGameName] = useState('')
  const { history, resetBoard } = useGameStore()
  const gameOptions = useMemo(
    () => [...new Set(history.map((entry) => entry.gameName).filter(Boolean))],
    [history]
  )
  const filteredHistory = useMemo(
    () => selectedGameName
      ? history.filter((entry) => entry.gameName === selectedGameName)
      : history,
    [history, selectedGameName]
  )
  const totals = useMemo(() => {
    const playerTotals = new Map()

    filteredHistory.forEach((entry) => {
      entry.players.forEach((player) => {
        const key = player.name.trim().toLowerCase()
        const previous = playerTotals.get(key)

        playerTotals.set(key, {
          id: previous?.id || player.id,
          name: player.name,
          color: previous?.color || player.color,
          total: (previous?.total || 0) + player.total,
        })
      })
    })

    return [...playerTotals.values()].sort((a, b) => b.total - a.total)
  }, [filteredHistory])
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
        <section className="paper-card compact-card">
          <div className="card-heading">🎲 Loc theo tua game</div>
          <select
            className="demo-input"
            value={selectedGameName}
            onChange={(event) => setSelectedGameName(event.target.value)}
          >
            <option value="">Tat ca tua game</option>
            {gameOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </section>

        {winner ? (
          <section className="paper-card result-card">
            <div className="result-title">🏆 Ket qua</div>
            <div className="result-subtitle">{selectedGameName || 'Tat ca tua game'}</div>

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

        <div className="history-headline">
          {filteredHistory.length} van da choi
          {selectedGameName ? ` - ${selectedGameName}` : ''}
        </div>
        <div className="history-list">
          {filteredHistory.map((entry) => (
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
