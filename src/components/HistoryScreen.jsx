import React, { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getMatch, getMatches } from '../api/backendService'

const MEDALS = ['🥇', '🥈', '🥉']
const PLAYER_COLORS = ['#ea6556', '#5a98e6', '#6fbe78', '#e3af47', '#b57be7', '#ef8e45']

export function HistoryScreen({ onNewGame, onShowSetup, toast }) {
  const [selectedGameName, setSelectedGameName] = useState('')
  const [history, setHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const { resetBoard } = useGameStore()

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      setIsLoadingHistory(true)
      try {
        const matches = await getMatches()
        const detailedMatches = await Promise.all(matches.map(async (match) => {
          try {
            return await getMatch(match.id)
          } catch {
            return match
          }
        }))
        if (isMounted) setHistory(detailedMatches)
      } catch {
        toast('Khong tai duoc lich su')
      } finally {
        if (isMounted) setIsLoadingHistory(false)
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [toast])

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

        {/* {winner ? (
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
        ) : null} */}

        {/* {totals.length > 0 ? (
          <section className="paper-card compact-card">
            <div className="card-heading">📋 Bang xep hang</div>
            <div className="ranking-list">
              {totals.map((player, index) => (
                <div key={player.id} className="ranking-row">
                  <span className="rank-badge">{index + 1}</span>
                  <span className="player-dot-inline" style={{ background: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length] }} />
                  <span className="ranking-name">{player.name}</span>
                  <strong>{player.total} pts</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null} */}

        <div className="history-headline">
          {isLoadingHistory ? 'Dang tai lich su...' : `${filteredHistory.length} van da choi`}
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
                {entry.players.map((player, index) => (
                  <div key={player.id} className="history-player-pill">
                    <span className="player-dot-inline" style={{ background: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length] }} />
                    <span>{player.name}: {player.total}</span>
                  </div>
                ))}
              </div>
              {Array.isArray(entry.scoreRows) && entry.scoreRows.length > 0 ? (
                <div className="history-score-table-wrap">
                  <div className="history-score-table">
                    <div className="history-score-header">Hang muc</div>
                    {entry.players.map((player) => (
                      <div key={player.id} className="history-score-header">
                        {player.name}
                      </div>
                    ))}

                    {entry.scoreRows.map((row) => (
                      <React.Fragment key={row.id}>
                        <div className="history-score-label">{row.name}</div>
                        {entry.players.map((player) => (
                          <div key={player.id} className="history-score-cell">
                            {row.scores?.[player.id] ?? (row.type === 'text' ? '' : 0)}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : null}
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
