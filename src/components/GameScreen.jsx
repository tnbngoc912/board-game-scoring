import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

function buildDraft(categories, players, publishedScores) {
  return categories.map((category) => {
    const existing = publishedScores.find((entry) => entry.id === category.id)
    const scores = {}

    players.forEach((player) => {
      scores[player.id] = existing?.scores?.[player.id] ?? 0
    })

    return {
      id: category.id,
      name: category.name,
      scores,
    }
  })
}

export function GameScreen({ toast, onShowSetup, onShowHistory }) {
  const { gameName, players, categories, publishedScores, publishScores, getTotals } = useGameStore()
  const [draftScores, setDraftScores] = useState(() => buildDraft(categories, players, publishedScores))

  useEffect(() => {
    setDraftScores(buildDraft(categories, players, publishedScores))
  }, [categories, players, publishedScores])

  const totals = getTotals()

  function updateCell(categoryId, playerId, value) {
    const numeric = Number.parseInt(value, 10)
    setDraftScores((current) => current.map((row) => (
      row.id === categoryId
        ? {
            ...row,
            scores: {
              ...row.scores,
              [playerId]: Number.isNaN(numeric) ? 0 : numeric,
            },
          }
        : row
    )))
  }

  function getDraftTotal(playerId) {
    return draftScores.reduce((sum, row) => sum + (row.scores[playerId] ?? 0), 0)
  }

  async function handleSave() {
    const ok = await publishScores(draftScores)
    toast(ok ? 'Da luu ket qua' : 'Khong the luu ket qua')
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
        <button className="demo-tab active" onClick={onShowSetup}>✏️ Van moi</button>
        <button className="demo-tab" onClick={onShowHistory}>📜 Lich su</button>
      </div>

      <div className="screen-inner demo-layout">
        <button className="link-back" onClick={onShowSetup}>← Quay lai setup</button>

        <section className="paper-card">
          <div className="card-heading">📝 Nhap diem — {gameName || 'Khong ten'}</div>
          <div className="score-grid">
            <div className="score-grid-header">Hang muc</div>
            {players.map((player) => (
              <div key={player.id} className="score-grid-header player-header">
                <PlayerBadge player={player} />
                <span>{player.name}</span>
              </div>
            ))}

            {draftScores.map((row) => (
              <React.Fragment key={row.id}>
                <div className="score-grid-label">{row.name}</div>
                {players.map((player) => (
                  <div key={player.id} className="score-grid-cell">
                    <input
                      className="score-box"
                      type="number"
                      value={row.scores[player.id] ?? 0}
                      onChange={(e) => updateCell(row.id, player.id, e.target.value)}
                    />
                  </div>
                ))}
              </React.Fragment>
            ))}

            <div className="score-grid-total">Tong diem</div>
            {players.map((player) => (
              <div key={player.id} className="score-grid-winner">
                <span className="winner-cup">🏆</span>
                <strong>{getDraftTotal(player.id)}</strong>
              </div>
            ))}
          </div>
        </section>

        <button className="btn-primary demo-save" onClick={handleSave}>
          ✅ Luu ket qua
        </button>

        {totals.length > 0 ? (
          <section className="paper-card compact-card">
            <div className="card-heading">🏆 Bang xep hang hien tai</div>
            <div className="ranking-list">
              {totals.map((player, index) => (
                <div key={player.id} className="ranking-row">
                  <span className="rank-badge">{index + 1}</span>
                  <PlayerBadge player={player} />
                  <span className="ranking-name">{player.name}</span>
                  <strong>{player.total} pts</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function PlayerBadge({ player }) {
  return <span className="player-dot-inline" style={{ background: player.color }} />
}
