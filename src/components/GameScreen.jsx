import React, { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useGameStore } from '../store/gameStore'
import { LoadingOverlay } from './LoadingOverlay'

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
  const router = useRouter()
  const pathname = usePathname()
  const didRedirectRef = useRef(false)
  const {
    gameName,
    scoringType,
    players,
    categories,
    publishedScores,
    publishScores,
    clearPlayers,
  } = useGameStore()
  const [draftScores, setDraftScores] = useState(() => buildDraft(categories, players, publishedScores))
  const [focusedCell, setFocusedCell] = useState(null)
  const [matchDescription, setMatchDescription] = useState('')
  const [winnerPlayerId, setWinnerPlayerId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isTotalScoreOnly = scoringType === 'TOTAL_SCORE_ONLY'
  const isWinnerOnly = scoringType === 'WINNER_ONLY'

  useEffect(() => {
    if (pathname !== '/game') {
      didRedirectRef.current = false
      return
    }

    if (!gameName?.trim() && !didRedirectRef.current) {
      didRedirectRef.current = true
      router.replace('/')
    }
  }, [pathname, gameName, router])

  useEffect(() => {
    setDraftScores(buildDraft(categories, players, publishedScores))
  }, [categories, players, publishedScores])

  useEffect(() => {
    setWinnerPlayerId((current) => (
      players.some((player) => player.id === current) ? current : ''
    ))
  }, [players])

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
    if (isSaving) return

    if (isWinnerOnly && !winnerPlayerId) {
      toast('Vui long chon nguoi thang')
      return
    }

    const winnerOnlyScores = [{
      id: 'winner',
      name: 'Winner',
      type: 'number',
      scores: players.reduce((scores, player) => {
        scores[player.id] = player.id === winnerPlayerId ? 1 : 0
        return scores
      }, {}),
    }]
    setIsSaving(true)
    try {
      const ok = await publishScores(isWinnerOnly ? winnerOnlyScores : draftScores, matchDescription)
      toast(ok ? 'Da luu ket qua' : 'Khong the luu ket qua')
      if (ok) {
        clearPlayers()
        onShowHistory()
        return
      }
    } finally {
      setIsSaving(false)
    }
  }

  function handleClose() {
    if (isSaving) return

    clearPlayers()
    onShowSetup()
  }

  return (
    <div className="screen score-screen score-entry-screen loading-shell" aria-busy={isSaving}>
      {isSaving ? <LoadingOverlay label="Đang lưu..." /> : null}
      <header className="history-phone-header score-entry-header" aria-label="BGScore">
        <div className="history-detail-topbar score-entry-topbar">
          <div className="score-entry-spacer" aria-hidden="true" />
          <div className="home-logo">BGSCORE</div>
          <button className="score-close-btn" onClick={handleClose} aria-label="Dong" disabled={isSaving}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </header>

      <div className="score-content">
        {isWinnerOnly ? (
          <section className="winner-picker-card" aria-label="Chon nguoi thang">
            {players.map((player) => (
              <label key={player.id} className="winner-picker-row">
                <span>{player.name}</span>
                <input
                  type="checkbox"
                  checked={winnerPlayerId === player.id}
                  onChange={() => setWinnerPlayerId((current) => (
                    current === player.id ? '' : player.id
                  ))}
                />
              </label>
            ))}
          </section>
        ) : (
          <section className="score-board">
            <div className="score-grid-wrap score-board-scroll">
              <div
                className="score-grid score-entry-grid"
                style={{
                  gridTemplateColumns: `95px 8px repeat(${players.length}, minmax(70px, 1fr)) 8px`,
                  minWidth: `${104 + players.length * 70}px`,
                }}
              >
                <div className="score-grid-header score-grid-sticky score-grid-sticky-header" />
                <div className="grid-spacer"></div>
                {players.map((player) => (
                  <div key={player.id} className="score-grid-header player-header">
                    <span>{player.name}</span>
                  </div>
                ))}
                <div className="grid-spacer"></div>

                {draftScores.map((row) => (
                  <React.Fragment key={row.id}>
                    <div className={`score-grid-label score-grid-sticky${isTotalScoreOnly ? ' total-score-only' : ''}`}>{row.name || row.id}</div>
                    <div className={`grid-spacer${isTotalScoreOnly ? ' border' : ''}`}></div>
                    {players.map((player) => (
                      <div key={player.id} className={`score-grid-cell${isTotalScoreOnly ? ' total-score-only' : ''}`}>
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
                    <div className={`grid-spacer${isTotalScoreOnly ? ' border' : ''}`}></div>
                  </React.Fragment>
                ))}

                {!isTotalScoreOnly ? (
                  <>
                    <div className="score-grid-total score-grid-sticky">Tổng</div>
                    <div className="grid-spacer border"></div>
                    {players.map((player) => (
                      <div key={player.id} className="score-grid-winner">
                        <strong>{getDraftTotal(player.id)}</strong>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            </div>
          </section>
        )}


        <textarea
          className="match-description"
          value={matchDescription}
          onChange={(event) => setMatchDescription(event.target.value)}
          placeholder="Nhập mô tả ván chơi (tùy chọn)"
        />

        <button className="score-save-btn" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : 'Lưu kết quả'}
        </button>
      </div>
    </div>
  )
}
