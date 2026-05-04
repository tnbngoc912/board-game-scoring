import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { getBoardGames, getUsers } from '../api/backendService'

const DEFAULT_GENRES = ['Party', 'Chien Thuat', 'Deck Building', 'An Vai', 'Family', 'Euro']
const GAME_IMAGE_THEMES = [
  ['#b9d8d4', '#7fb0c8'],
  ['#e2c290', '#a76642'],
  ['#d7b08e', '#71472f'],
  ['#bad2a1', '#54855a'],
  ['#d7c2a4', '#8c613b'],
]

const GENRE_FALLBACKS = {
  wingspan: ['Family', 'Chien Thuat'],
  puerto: ['Chien Thuat', 'Euro'],
  civilization: ['Chien Thuat'],
  arnak: ['Chien Thuat', 'Deck Building'],
  istanbul: ['Family', 'Chien Thuat'],
  dune: ['Chien Thuat'],
}

function getMinPlayers(game) {
  return Number(game.min_players ?? game.minPlayers ?? game.player_min ?? game.minPlayer ?? 1)
}

function getMaxPlayers(game) {
  return Number(game.max_players ?? game.maxPlayers ?? game.player_max ?? game.maxPlayer ?? 5)
}

function formatPlayerRange(game) {
  return `${getMinPlayers(game)}-${getMaxPlayers(game)} nguoi choi`
}

function normalizeGenre(value) {
  return String(value || '').trim()
}

function getGenreLabels(game) {
  const rawGenres = game.genres || game.genre || game.tags || game.mechanics || game.types || game.type
  const values = Array.isArray(rawGenres) ? rawGenres : rawGenres ? [rawGenres] : []
  const labels = values
    .map((item) => normalizeGenre(item?.name || item?.label || item))
    .filter(Boolean)

  if (labels.length > 0) return labels

  const name = (game.name || '').toLowerCase()
  const fallbackKey = Object.keys(GENRE_FALLBACKS).find((key) => name.includes(key))
  return fallbackKey ? GENRE_FALLBACKS[fallbackKey] : ['Chien Thuat']
}

function getGameImageTheme(index) {
  return GAME_IMAGE_THEMES[index % GAME_IMAGE_THEMES.length]
}

export function SetupScreen({ onStart, homeResetToken, toast }) {
  const [setupStep, setSetupStep] = useState('games')
  const [searchTerm, setSearchTerm] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [playerCountFilter, setPlayerCountFilter] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [playDateTime, setPlayDateTime] = useState('2026-04-30T20:00')
  const {
    gameName,
    players,
    categories,
    selectGame,
    addPlayer,
    removePlayer,
  } = useGameStore()

  const [gameList, setGameList] = useState([])
  const [userList, setUserList] = useState([])
  const [isLoadingGames, setIsLoadingGames] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSetupData() {
      setIsLoadingGames(true)
      setIsLoadingUsers(true)
      try {
        const [games, users] = await Promise.all([getBoardGames(), getUsers()])
        if (isMounted) {
          setGameList(games)
          setUserList(users)
        }
      } catch {
        toast('Khong tai duoc du lieu setup')
      } finally {
        if (isMounted) {
          setIsLoadingGames(false)
          setIsLoadingUsers(false)
        }
      }
    }

    loadSetupData()

    return () => {
      isMounted = false
    }
  }, [toast])

  useEffect(() => {
    setSetupStep('games')
  }, [homeResetToken])

  const canStart = players.length >= 2 && players.every((player) => player.name.trim()) && categories.length >= 1
  const selectedGame = useMemo(
    () => gameList.find((game) => game.name === gameName) || null,
    [gameList, gameName]
  )
  const genreOptions = useMemo(() => {
    const labels = gameList.flatMap(getGenreLabels)
    return [...new Set([...DEFAULT_GENRES, ...labels])].filter(Boolean)
  }, [gameList])
  const filteredGames = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    const playerCount = Number(playerCountFilter)

    return gameList.filter((game) => {
      const gameGenres = getGenreLabels(game)
      const matchesName = !keyword || game.name.toLowerCase().includes(keyword)
      const matchesPlayers = !playerCountFilter || (
        getMinPlayers(game) <= playerCount && getMaxPlayers(game) >= playerCount
      )
      const matchesGenres = selectedGenres.length === 0 || selectedGenres.some((genre) => (
        gameGenres.includes(genre)
      ))

      return matchesName && matchesPlayers && matchesGenres
    })
  }, [gameList, playerCountFilter, searchTerm, selectedGenres])

  function isPlayerSelected(name, exceptPlayerId = null) {
    return players.some((player) => (
      player.id !== exceptPlayerId && player.name.trim().toLowerCase() === name.trim().toLowerCase()
    ))
  }

  function handleChooseGame(game) {
    selectGame(game)
    setSelectedUserIds([])
    setSetupStep('config')
  }

  function toggleGenre(genre) {
    setSelectedGenres((current) => (
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    ))
  }

  function resetFilters() {
    setSearchTerm('')
    setPlayerCountFilter('')
    setSelectedGenres([])
  }

  function formatPlayDateTime(value) {
    if (!value) return ''
    const [datePart, timePart] = value.split('T')
    const [year, month, day] = datePart.split('-')
    return `${timePart}, ${day}/${month}/${year}`
  }

  function handleStart() {
    if (!canStart) {
      toast('Can it nhat 2 nguoi choi va 1 hang muc')
      return
    }
    onStart()
  }

  function toggleUserSelection(userId) {
    setSelectedUserIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ))
  }

  function handleAddSelectedPlayers() {
    if (selectedUserIds.length === 0) {
      toast('Vui long chon nguoi choi')
      return
    }

    selectedUserIds.forEach((userId) => {
      const user = userList.find((item) => item.id === userId)
      if (user && !isPlayerSelected(user.name)) addPlayer(user.name, user.id)
    })
    setSelectedUserIds([])
    setSetupStep('config')
  }

  function openPlayerPicker() {
    setSelectedUserIds([])
    setSetupStep('player-picker')
  }

  return (
    <div className={`screen${setupStep === 'games' ? ' home-screen' : ''}`}>
      {setupStep === 'games' ? (
        <>
          <header className="home-header">
            <div className="home-logo">BGSCORE</div>
          </header>

          <div className="screen-inner home-content">
            <section className="home-search-panel" aria-label="Tim va loc game">
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
                  placeholder="Tim tro choi"
                  aria-label="Tim ten game"
                />
                <span className="search-divider" aria-hidden="true" />
                <button
                  className={`filter-button${isFilterOpen ? ' active' : ''}`}
                  type="button"
                  onClick={() => setIsFilterOpen((value) => !value)}
                  aria-label="Bo loc"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 5h16l-6.4 7.4v5.2L10.4 19v-6.6L4 5z" />
                  </svg>
                </button>
              </div>

              {isFilterOpen ? (
                <div className="filter-panel">
                  <label className="filter-field">
                    <span>So nguoi choi</span>
                    <select value={playerCountFilter} onChange={(event) => setPlayerCountFilter(event.target.value)}>
                      <option value="">Tat ca</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                        <option key={count} value={count}>{count} nguoi</option>
                      ))}
                    </select>
                  </label>

                  <div className="genre-filter">
                    <div className="filter-label">The loai</div>
                    <div className="genre-chip-list">
                      {genreOptions.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          className={`genre-chip${selectedGenres.includes(genre) ? ' active' : ''}`}
                          onClick={() => toggleGenre(genre)}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="home-game-section">
              {isLoadingGames ? (
                <div className="home-game-list" aria-busy="true" aria-label="Dang tai game">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="home-game-card home-game-card-skeleton">
                      <div className="home-game-thumb" aria-hidden="true" />
                      <div className="home-game-info">
                        <span className="home-skeleton-line title" />
                        <span className="home-skeleton-line" />
                        <span className="home-skeleton-line short" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {!isLoadingGames && gameList.length === 0 ? (
                <div className="paper-card empty-state">Chua co game nao.</div>
              ) : null}

              {!isLoadingGames && gameList.length > 0 && filteredGames.length === 0 ? (
                <div className="paper-card empty-state home-empty-state">
                  <div>Khong tim thay game phu hop.</div>
                  <button className="secondary-mini" onClick={resetFilters}>Xoa bo loc</button>
                </div>
              ) : null}

              {!isLoadingGames && filteredGames.length > 0 ? (
                <div className="home-game-list">
                  {filteredGames.map((game, index) => {
                    const [startColor, endColor] = getGameImageTheme(index)
                    const genres = getGenreLabels(game)

                    return (
                      <motion.button
                        type="button"
                        key={game.id || game.name}
                        className="home-game-card"
                        onClick={() => handleChooseGame(game)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <div
                          className="home-game-thumb"
                          style={{ background: `linear-gradient(135deg, ${startColor}, ${endColor})` }}
                          aria-hidden="true"
                        >
                          <img loading="lazy" alt="" width={50} height={50} src={game.thumbnail_url} />
                        </div>
                        <div className="home-game-info">
                          <h2>{game.name}</h2>
                          <p>{formatPlayerRange(game)}</p>
                          <p>{genres.join(', ')}</p>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              ) : null}
            </section>
          </div>
        </>
      ) : setupStep === 'player-picker' ? (
        <>
          <header className="picker-topbar">
            <h1>Chon Nguoi Choi</h1>
            <button className="picker-close-btn" onClick={() => setSetupStep('config')} aria-label="Dong">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div className="screen-inner player-picker-content">
            {isLoadingUsers ? (
              <div className="paper-card empty-state">Dang tai nguoi choi...</div>
            ) : null}

            <div className="player-picker-list">
              {userList.map((user) => {
                const disabled = isPlayerSelected(user.name)
                const checked = selectedUserIds.includes(user.id)

                return (
                  <label key={user.id} className={`player-picker-row${disabled ? ' disabled' : ''}`}>
                    <span>{user.name}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </label>
                )
              })}
            </div>
          </div>

          <div className="player-picker-footer">
            <button className="player-picker-submit" onClick={handleAddSelectedPlayers}>
              Them nguoi choi
            </button>
          </div>
        </>
      ) : (
        <>
          <header className="setup-topbar">
            <button className="setup-back-btn" onClick={() => setSetupStep('games')} aria-label="Quay lai">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6 9 12l6 6" />
                <path d="M10 12h9" />
              </svg>
            </button>
            <h1>{selectedGame?.name || gameName || 'Chua chon tro choi'}</h1>
          </header>

          <div className="screen-inner setup-flow">
            <section className="setup-section">
              <h2>Nguoi choi</h2>
              <div className="setup-row-list">
                <AnimatePresence initial={false}>
                  {players.map((player) => (
                    <motion.div
                      key={player.id}
                      className="setup-player-row"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <span>{player.name}</span>
                      <button className="setup-circle-btn remove" onClick={() => removePlayer(player.id)} aria-label={`Xoa ${player.name}`}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10" /></svg>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button className="setup-player-row add" onClick={openPlayerPicker}>
                  <span>Them nguoi choi</span>
                  <span className="setup-circle-btn add" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12" /></svg>
                  </span>
                </button>
              </div>
            </section>

            <section className="setup-section">
              <h2>Ngay gio</h2>
              <div className="setup-date-row">
                <span>{formatPlayDateTime(playDateTime)}</span>
                <label className="setup-date-button" aria-label="Chon ngay gio">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 3v4M17 3v4M4.5 9h15M6 5h12a2 2 0 0 1 2 2v8" />
                    <path d="M6 5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8" />
                    <path d="m15 19 4-4 2 2-4 4h-2v-2z" />
                  </svg>
                  <input
                    type="datetime-local"
                    value={playDateTime}
                    onChange={(event) => setPlayDateTime(event.target.value)}
                  />
                </label>
              </div>
            </section>

            <button className="setup-start-btn" onClick={handleStart}>
              Bat dau nhap diem
            </button>
          </div>
        </>
      )}
    </div>
  )
}
