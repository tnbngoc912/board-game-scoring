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
  const [matchDescription, setMatchDescription] = useState('')

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
    const ok = await publishScores(draftScores, matchDescription)
    toast(ok ? 'Da luu ket qua' : 'Khong the luu ket qua')
    if (ok) onShowHistory()
  }

  return (
    <div className="screen score-screen score-entry-screen">
      <header className="score-topbar score-entry-header" aria-label="BGScore">
        <div className="score-entry-topbar">
          <div className="score-entry-spacer" aria-hidden="true" />
          <div className="home-logo">BGSCORE</div>
          <button className="score-close-btn" onClick={onShowSetup} aria-label="Dong">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </header>

      <div className="score-content">
        <section className="score-board">
          <div className="score-grid-wrap score-board-scroll">
            <div
              className="score-grid score-entry-grid"
              style={{
                gridTemplateColumns: `88px repeat(${players.length}, 70px)`,
                minWidth: `${88 + players.length * 70}px`,
              }}
            >
              <div className="score-grid-header score-grid-sticky score-grid-sticky-header" />
              {players.map((player) => (
                <div key={player.id} className="score-grid-header player-header">
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
                  <strong>{getDraftTotal(player.id)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="score-scroll-indicator" aria-hidden="true">
          <span />
        </div>

        <textarea
          className="match-description"
          value={matchDescription}
          onChange={(event) => setMatchDescription(event.target.value)}
          placeholder="Nhap mo ta van choi"
        />

        <button className="score-save-btn" onClick={handleSave}>
          Luu ket qua
        </button>
      </div>
    </div>
  )
}
