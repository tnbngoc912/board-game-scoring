import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { deleteMatch, getMatch, getMatches } from '../api/backendService'

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

function getSortableTime(entry) {
  if (entry.playedAtRaw) return new Date(entry.playedAtRaw).getTime() || 0
  return entry.id ? Number(String(entry.id).slice(0, 8)) || 0 : 0
}

function getWinner(entry) {
  if (entry.winner) return entry.winner
  return [...(entry.players || [])].sort((a, b) => b.total - a.total)[0] || null
}

function formatWinner(entry) {
  const winner = getWinner(entry)
  if (!winner) return 'Chua co nguoi thang'
  return `${winner.name} - ${winner.total} diem`
}

export function HistoryScreen({ onNewGame, onShowSetup, toast }) {
  const [selectedGameName, setSelectedGameName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [matchToDelete, setMatchToDelete] = useState(null)
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
        const sortedMatches = detailedMatches.sort((a, b) => getSortableTime(b) - getSortableTime(a))
        if (isMounted) setHistory(sortedMatches)
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
    () => [...new Set(history.map((entry) => entry.gameName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [history]
  )
  const filteredHistory = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return history.filter((entry) => {
      const matchesGame = !selectedGameName || entry.gameName === selectedGameName
      const matchesSearch = !keyword || (entry.description || '').toLowerCase().includes(keyword)
      return matchesGame && matchesSearch
    })
  }, [history, searchTerm, selectedGameName])
  const hasFilters = Boolean(selectedGameName || searchTerm.trim())

  async function handleNewGame() {
    const ok = await resetBoard()
    if (ok) {
      toast('Da tao van moi')
      onNewGame()
    } else {
      toast('Khong the tao van moi')
    }
  }

  function clearFilters() {
    setSelectedGameName('')
    setSearchTerm('')
    setIsFilterOpen(false)
  }

  function openDeleteConfirm(entry, event) {
    event.stopPropagation()
    setMatchToDelete(entry)
  }

  async function confirmDelete() {
    if (!matchToDelete) return

    setIsDeleting(true)
    try {
      await deleteMatch(matchToDelete.id)
      setHistory((current) => current.filter((entry) => entry.id !== matchToDelete.id))
      if (selectedMatch?.id === matchToDelete.id) setSelectedMatch(null)
      setMatchToDelete(null)
      setIsDetailMenuOpen(false)
      toast('Da xoa bang diem')
    } catch {
      toast('Khong the xoa bang diem')
    } finally {
      setIsDeleting(false)
    }
  }

  if (selectedMatch) {
    const winner = getWinner(selectedMatch)
    const players = selectedMatch.players || []
    const scoreRows = selectedMatch.scoreRows || []

    return (
      <div className="screen score-screen history-detail-screen">
        <header className="score-topbar history-detail-topbar">
          <button className="score-back-btn" onClick={() => {
            setIsDetailMenuOpen(false)
            setSelectedMatch(null)
          }} aria-label="Quay lai">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6 9 12l6 6" />
              <path d="M10 12h9" />
            </svg>
          </button>
          <h1>Bang Diem</h1>
          <button
            className="score-menu-btn"
            onClick={() => setIsDetailMenuOpen((value) => !value)}
            aria-label="Mo tuy chon"
            aria-expanded={isDetailMenuOpen}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>
        </header>

        <DetailActionMenu
          isOpen={isDetailMenuOpen}
          onClose={() => setIsDetailMenuOpen(false)}
          onEdit={() => {
            setIsDetailMenuOpen(false)
            toast('Tinh nang chinh sua se duoc bo sung')
          }}
          onDelete={() => {
            setIsDetailMenuOpen(false)
            setMatchToDelete(selectedMatch)
          }}
        />

        <div className={isDetailMenuOpen ? 'detail-content dimmed' : 'detail-content'}>
          <section className="match-summary-strip">
            <div className="history-game-thumb detail-thumb" style={{ background: `linear-gradient(135deg, ${getGameImageTheme(1).join(', ')})` }}>
              <span>{selectedMatch.gameName?.slice(0, 2).toUpperCase() || 'BG'}</span>
            </div>
            <div>
              <h2>{selectedMatch.gameName}</h2>
              <p>{selectedMatch.playedAt}</p>
            </div>
          </section>

          <section className="score-board history-score-board">
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

                {scoreRows.map((row) => (
                  <React.Fragment key={row.id}>
                    <div className="score-grid-label score-grid-sticky">{row.name}</div>
                    {players.map((player) => (
                      <div key={player.id} className="score-grid-cell">
                        <div className={`readonly-score-box${row.type === 'text' ? ' text' : ''}`}>
                          {row.scores?.[player.id] ?? (row.type === 'text' ? '' : 0)}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}

                <div className="score-grid-total score-grid-sticky">Tong</div>
                {players.map((player) => (
                  <div key={player.id} className="score-grid-winner">
                    <strong className={winner?.id === player.id ? 'winning-total' : ''}>{player.total}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {selectedMatch.description ? (
            <div className="history-detail-note">{selectedMatch.description}</div>
          ) : null}
        </div>

        {isDetailMenuOpen ? (
          <button
            className="detail-menu-dismiss"
            type="button"
            onClick={() => setIsDetailMenuOpen(false)}
            aria-label="Dong tuy chon"
          />
        ) : null}

        <DeleteConfirmDialog
          entry={matchToDelete}
          isDeleting={isDeleting}
          onCancel={() => setMatchToDelete(null)}
          onConfirm={confirmDelete}
        />
      </div>
    )
  }

  return (
    <div className="screen history-screen">
      <header className="history-phone-header" aria-label="BGScore">
        <div className="history-brandbar">
          <div className="home-logo">BGSCORE</div>
        </div>
      </header>

      <div className="screen-inner history-content">
        <section className="home-search-panel" aria-label="Tim va loc lich su">
          <div className="search-bar">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5L21 21" />
              </svg>
            </span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tim van choi"
              aria-label="Tim trong mo ta van choi"
            />
            <span className="search-divider" aria-hidden="true" />
            <button
              className={`filter-button${isFilterOpen || selectedGameName ? ' active' : ''}`}
              type="button"
              onClick={() => setIsFilterOpen((value) => !value)}
              aria-label="Bo loc game"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16l-6.4 7.4v5.2L10.4 19v-6.6L4 5z" />
              </svg>
            </button>
          </div>

          {isFilterOpen ? (
            <div className="filter-panel history-filter-panel">
              <label className="filter-field">
                <span>Ten game</span>
                <select value={selectedGameName} onChange={(event) => setSelectedGameName(event.target.value)}>
                  <option value="">Tat ca tua game</option>
                  {gameOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              {hasFilters ? <button className="secondary-mini history-clear-btn" onClick={clearFilters}>Bo loc</button> : null}
            </div>
          ) : null}
        </section>

        <div className="history-list">
          {isLoadingHistory ? <div className="paper-card empty-state">Dang tai lich su...</div> : null}

          {!isLoadingHistory && history.length === 0 ? (
            <div className="paper-card history-empty-state">
              <h2>Chua co van dau nao duoc ghi lai</h2>
              <p>Luu ket qua van choi dau tien de xem lai bang diem tai day.</p>
              <button className="score-save-btn history-empty-btn" onClick={handleNewGame}>Tao van moi</button>
            </div>
          ) : null}

          {!isLoadingHistory && history.length > 0 && filteredHistory.length === 0 ? (
            <div className="paper-card history-empty-state">
              <h2>Khong tim thay van dau</h2>
              <p>Thu tu khoa khac hoac bo loc game khac.</p>
              <button className="secondary-mini history-clear-btn" onClick={clearFilters}>Bo loc</button>
            </div>
          ) : null}

          <AnimatePresence initial={false}>
            {filteredHistory.map((entry, index) => {
              const [startColor, endColor] = getGameImageTheme(index)
              const winner = getWinner(entry)

              return (
                <motion.article
                  key={entry.id}
                  className="history-card-v2"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedMatch(entry)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setSelectedMatch(entry)
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.015 }}
                >
                  <div className="history-game-thumb" style={{ background: `linear-gradient(135deg, ${startColor}, ${endColor})` }} aria-hidden="true">
                    <span>{entry.gameName?.slice(0, 2).toUpperCase() || 'BG'}</span>
                  </div>
                  <div className="history-card-main">
                    <h2>{entry.description || entry.gameName}</h2>
                    <p>{entry.playedAt}</p>
                    <div className="history-winner-line">
                      <span aria-hidden="true">♛</span>
                      <span>{winner ? winner.name : 'Chua co nguoi thang'}</span>
                      {winner ? <strong>{winner.total}</strong> : null}
                    </div>
                    <div className="history-game-name">{entry.gameName}</div>
                  </div>
                  <button
                    className="history-delete-btn"
                    type="button"
                    onClick={(event) => openDeleteConfirm(entry, event)}
                    aria-label={`Xoa bang diem ${entry.gameName}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 7h16" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M6 7l1 14h10l1-14" />
                      <path d="M9 7V4h6v3" />
                    </svg>
                  </button>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      <DeleteConfirmDialog
        entry={matchToDelete}
        isDeleting={isDeleting}
        onCancel={() => setMatchToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function DetailActionMenu({ isOpen, onEdit, onDelete }) {
  if (!isOpen) return null

  return (
    <div className="detail-action-menu" role="menu" aria-label="Tuy chon bang diem">
      <button type="button" role="menuitem" className="detail-action-item" onClick={onEdit}>
        <span className="detail-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 16.5V20h3.5L18.1 9.4l-3.5-3.5L4 16.5z" />
            <path d="M13.5 7 17 10.5" />
            <path d="M15.4 4.1l1.2-1.2a2 2 0 0 1 2.8 0l1.7 1.7a2 2 0 0 1 0 2.8l-1.2 1.2" />
          </svg>
        </span>
        <span>Chinh sua bang diem</span>
      </button>

      <button type="button" role="menuitem" className="detail-action-item" onClick={onDelete}>
        <span className="detail-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 7h16" />
            <path d="M10 11v6M14 11v6" />
            <path d="M6 7l1 14h10l1-14" />
            <path d="M9 7V4h6v3" />
          </svg>
        </span>
        <span>Xoa bang diem</span>
      </button>
    </div>
  )
}

function DeleteConfirmDialog({ entry, isDeleting, onCancel, onConfirm }) {
  if (!entry) return null

  return (
    <div className="confirm-backdrop" role="presentation">
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-history-title">
        <h2 id="delete-history-title">Xoa bang diem</h2>
        <p>Ban co chac muon xoa bang diem cua van choi nay?</p>
        <p className="confirm-subtext">{entry.gameName} · {formatWinner(entry)}</p>
        <div className="confirm-actions">
          <button className="confirm-secondary" onClick={onCancel} disabled={isDeleting}>Giu lai</button>
          <button className="confirm-danger" onClick={onConfirm} disabled={isDeleting}>{isDeleting ? 'Dang xoa...' : 'Xoa'}</button>
        </div>
      </div>
    </div>
  )
}
