import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { getBoardGames, getUsers } from '../api/backendService'

const CUSTOM_PLAYER_VALUE = '__custom__'
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

function capitalizeFirstLetter(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
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
  const [newPlayerChoice, setNewPlayerChoice] = useState('')
  const [customPlayerName, setCustomPlayerName] = useState('')
  const [customPlayerIds, setCustomPlayerIds] = useState(() => new Set())
  const [categoryName, setCategoryName] = useState('')
  const {
    gameName,
    players,
    categories,
    selectGame,
    addPlayer,
    removePlayer,
    updatePlayerName,
    addCategory,
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

  function handleAddPlayer(name = customPlayerName, apiUserId = null) {
    if (isPlayerSelected(name)) {
      toast('Nguoi choi da co trong danh sach')
      return
    }

    if (!addPlayer(name, apiUserId)) return
    setNewPlayerChoice('')
    setCustomPlayerName('')
  }

  function handleNewPlayerChoice(value) {
    if (value === CUSTOM_PLAYER_VALUE) {
      setNewPlayerChoice(value)
      setCustomPlayerName('')
      return
    }

    setNewPlayerChoice('')
    const user = userList.find((item) => item.id === value)
    if (user) handleAddPlayer(user.name, user.id)
  }

  function handleAddCategory(name = categoryName) {
    if (!addCategory(name)) return
    setCategoryName('')
  }

  function handleChooseGame(game) {
    selectGame(game)
    setCategoryName('')
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

  function handlePlayerChoice(playerId, value) {
    if (value === CUSTOM_PLAYER_VALUE) {
      setCustomPlayerIds((current) => new Set(current).add(playerId))
      updatePlayerName(playerId, '')
      return
    }

    setCustomPlayerIds((current) => {
      const next = new Set(current)
      next.delete(playerId)
      return next
    })

    const user = userList.find((item) => item.id === value)
    if (!user) return

    if (isPlayerSelected(user.name, playerId)) {
      toast('Nguoi choi da co trong danh sach')
      return
    }

    updatePlayerName(playerId, user.name, user.id)
  }

  function handleStart() {
    if (!canStart) {
      toast('Can it nhat 2 nguoi choi va 1 hang muc')
      return
    }
    onStart()
  }

  return (
    <div className="screen">
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
                <div className="paper-card empty-state">Dang tai...</div>
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
                          <span>{game.name?.slice(0, 2).toUpperCase() || 'BG'}</span>
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
      ) : (
        <>
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
            <button className="link-back" onClick={() => setSetupStep('games')}>← Doi game</button>

            <section className="paper-card setup-summary-card">
              <div>
                <div className="summary-label">Tro choi da chon</div>
                <div className="summary-title">{selectedGame?.name || gameName || 'Chua chon tro choi'}</div>
              </div>
            </section>

            <section className="paper-card">
              <div className="card-heading">👥 Nguoi choi</div>
              <div className="stack-list">
                <AnimatePresence initial={false}>
                  {players.map((player) => (
                    <motion.div
                      key={player.id}
                      className="stack-row"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      {/* <PlayerDot player={player} size={34} /> */}
                      <div className="player-select-group">
                        <select
                          className="demo-input"
                          value={customPlayerIds.has(player.id) || !player.apiUserId ? CUSTOM_PLAYER_VALUE : player.apiUserId}
                          onChange={(e) => handlePlayerChoice(player.id, e.target.value)}
                        >
                          <option value="">{isLoadingUsers ? 'Dang tai nguoi choi...' : 'Chon nguoi choi'}</option>
                          {userList.map((user) => (
                            <option key={user.id} value={user.id} disabled={isPlayerSelected(user.name, player.id)}>
                              {user.name}
                            </option>
                          ))}
                          <option value={CUSTOM_PLAYER_VALUE}>Nhap nguoi choi moi</option>
                        </select>
                        {(customPlayerIds.has(player.id) || !player.apiUserId) ? (
                          <input
                            className="demo-input"
                            value={player.name}
                            onChange={(e) => updatePlayerName(player.id, e.target.value)}
                            placeholder="Ten nguoi choi"
                          />
                        ) : null}
                      </div>
                      <button className="remove-chip" onClick={() => removePlayer(player.id)}>×</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="inline-form">
                <div className="player-select-group">
                  <select
                    className="demo-input"
                    value={newPlayerChoice}
                    onChange={(e) => handleNewPlayerChoice(e.target.value)}
                  >
                    <option value="">{isLoadingUsers ? 'Dang tai nguoi choi...' : 'Them nguoi choi'}</option>
                    {userList.map((user) => (
                      <option key={user.id} value={user.id} disabled={isPlayerSelected(user.name)}>
                        {user.name}
                      </option>
                    ))}
                    <option value={CUSTOM_PLAYER_VALUE}>Nhap nguoi choi moi</option>
                  </select>
                  {newPlayerChoice === CUSTOM_PLAYER_VALUE ? (
                    <input
                      className="demo-input"
                      value={customPlayerName}
                      onChange={(e) => setCustomPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                      placeholder="Ten nguoi choi moi"
                    />
                  ) : null}
                </div>
                {newPlayerChoice === CUSTOM_PLAYER_VALUE ? (
                  <button className="secondary-mini" onClick={() => handleAddPlayer()}>+ Them</button>
                ) : null}
              </div>
            </section>

            <section className="paper-card">
              <div className="card-heading">📊 Hang muc tinh diem</div>
              <div className="stack-list">
                <AnimatePresence initial={false}>
                  {categories.map((category) => (
                    <motion.div
                      key={category.id}
                      className="stack-row"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <div className="stack-row-label">{capitalizeFirstLetter(category.name)}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="inline-form">
                <input
                  className="demo-input"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Them hang muc"
                />
                <button className="secondary-mini" onClick={() => handleAddCategory()}>+ Them</button>
              </div>
            </section>

            <button className="btn-primary demo-save" onClick={handleStart}>
              🎲 Bat dau nhap diem
            </button>
          </div>
        </>
      )}
    </div>
  )
}
