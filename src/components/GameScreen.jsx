import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'

function buildDraft(categories, players, publishedScores) {
  return categories.map((category) => {
    const existing = publishedScores.find((entry) => entry.id === category.id)
    const type = category.type === 'text' ? 'text' : 'number'
    const scores = {}

    players.forEach((player) => {
      scores[player.id] = existing?.scores?.[player.id] ?? (type === 'text' ? '' : 0)
    })

    return {
      id: category.id,
      name: category.name,
      type,
      scores,
    }
  })
}

export function GameScreen({ toast, onShowSetup, onShowHistory }) {
  const { gameName, players, categories, publishedScores, publishScores } = useGameStore()
  const [draftScores, setDraftScores] = useState(() => buildDraft(categories, players, publishedScores))
  const [focusedCell, setFocusedCell] = useState(null)

  useEffect(() => {
    setDraftScores(buildDraft(categories, players, publishedScores))
  }, [categories, players, publishedScores])

  function updateCell(categoryId, playerId, value, type) {
    const nextValue = type === 'text'
      ? value
      : Number.parseInt(value, 10)

    setDraftScores((current) => current.map((row) => (
      row.id === categoryId
        ? {
          ...row,
          scores: {
            ...row.scores,
            [playerId]: type === 'text' || !Number.isNaN(nextValue) ? nextValue : 0,
          },
        }
        : row
    )))
  }

  function getInputValue(row, playerId) {
    const value = row.scores[playerId] ?? (row.type === 'text' ? '' : 0)
    if (row.type !== 'text' && focusedCell === `${row.id}:${playerId}` && value === 0) return ''
    return value
  }

  function getDraftTotal(playerId) {
    return draftScores.reduce((sum, row) => {
      if (row.type === 'text') return sum

      const score = Number(row.scores[playerId] ?? 0)
      return sum + (Number.isNaN(score) ? 0 : score)
    }, 0)
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
          <div className="score-grid-wrap">
            <div
              className="score-grid"
              style={{
                gridTemplateColumns: `minmax(120px, 140px) repeat(${players.length}, minmax(96px, 1fr))`,
                minWidth: `${140 + players.length * 108}px`,
              }}
            >
              <div className="score-grid-header score-grid-sticky score-grid-sticky-header">Hang muc</div>
              {players.map((player) => (
                <div key={player.id} className="score-grid-header player-header">
                  <PlayerBadge player={player} />
                  <span>{player.name}</span>
                </div>
              ))}

              {draftScores.map((row) => (
                <React.Fragment key={row.id}>
                  <div className="score-grid-label score-grid-sticky">{row.name}</div>
                  {players.map((player) => (
                    <div key={player.id} className="score-grid-cell">
                      <input
                        className={`score-box${row.type === 'text' ? ' score-box-text' : ''}`}
                        type={row.type === 'text' ? 'text' : 'number'}
                        value={getInputValue(row, player.id)}
                        onChange={(e) => updateCell(row.id, player.id, e.target.value, row.type)}
                        onFocus={() => setFocusedCell(`${row.id}:${player.id}`)}
                        onBlur={() => setFocusedCell(null)}
                      />
                    </div>
                  ))}
                </React.Fragment>
              ))}

              <div className="score-grid-total score-grid-sticky">Tong diem</div>
              {players.map((player) => (
                <div key={player.id} className="score-grid-winner">
                  <span className="winner-cup">🏆</span>
                  <strong>{getDraftTotal(player.id)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <button className="btn-primary demo-save" onClick={handleSave}>
          ✅ Luu ket qua
        </button>
      </div>
    </div>
  )
}

function PlayerBadge({ player }) {
  return <span className="player-dot-inline" style={{ background: player.color }} />
}
