import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useAppDataStore } from '../store/appDataStore'
import { LoadingOverlay } from './LoadingOverlay'
import { GameCard } from './GameCard'
import Image from "next/image"

const GAME_IMAGE_THEMES = [
  ['#b9d8d4', '#7fb0c8'],
  ['#e2c290', '#a76642'],
  ['#d7b08e', '#71472f'],
  ['#bad2a1', '#54855a'],
  ['#d7c2a4', '#8c613b'],
]

function getMinPlayers(game) {
  return Number(game.min_players ?? game.minPlayers ?? game.player_min ?? game.minPlayer ?? 1)
}

function getMaxPlayers(game) {
  return Number(game.max_players ?? game.maxPlayers ?? game.player_max ?? game.maxPlayer ?? 5)
}

function formatPlayerRange(game) {
  return `${getMinPlayers(game)}-${getMaxPlayers(game)} người chơi`
}

function normalizeGenre(value) {
  return String(value || '').trim()
}

function getGenreLabels(game) {
  const rawGenres = (
    game.category_ids ||
    game.categoryIds ||
    game.genres ||
    game.genre ||
    game.tags ||
    game.mechanics ||
    game.types ||
    game.type
  )
  const values = Array.isArray(rawGenres) ? rawGenres : rawGenres ? [rawGenres] : []
  return values
    .map((item) => normalizeGenre(item?.name || item?.label || item))
    .filter(Boolean)
}

function getGameImageTheme(index) {
  return GAME_IMAGE_THEMES[index % GAME_IMAGE_THEMES.length]
}

export function SetupScreen({ onStart, homeResetToken, toast, initialStep = 'games', onBackFromConfig, onChooseGame }) {
  const [setupStep, setSetupStep] = useState(initialStep)
  const [gameSearchTerm, setGameSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [playerCountFilter, setPlayerCountFilter] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [selectedUsersById, setSelectedUsersById] = useState({})
  const [playDateTime, setPlayDateTime] = useState('2026-04-30T20:00')
  const {
    gameName,
    players,
    categories,
    selectGame,
    addPlayer,
    removePlayer,
  } = useGameStore()

  const gameList = useAppDataStore((state) => state.boardGames)
  const userList = useAppDataStore((state) => state.users)
  const isLoadingGames = useAppDataStore((state) => state.isLoadingBoardGames)
  const isLoadingUsers = useAppDataStore((state) => state.isLoadingUsers)
  const fetchBoardGames = useAppDataStore((state) => state.fetchBoardGames)
  const fetchUsers = useAppDataStore((state) => state.fetchUsers)

  useEffect(() => {
    async function loadSetupData() {
      try {
        await Promise.all([fetchBoardGames(), fetchUsers()])
      } catch {
        toast('Khong tai duoc du lieu setup')
      }
    }

    loadSetupData()
  }, [fetchBoardGames, fetchUsers, toast])

  useEffect(() => {
    setSetupStep(initialStep)
  }, [homeResetToken, initialStep])

  const selectedGame = useMemo(
    () => gameList.find((game) => game.name === gameName) || null,
    [gameList, gameName]
  )
  const canStart = players.length >= 2 && players.every((player) => player.name.trim())
  const maxPlayersAllowed = selectedGame ? getMaxPlayers(selectedGame) : Number.POSITIVE_INFINITY
  const isPickerAtMaxPlayers = players.length + selectedUserIds.length >= maxPlayersAllowed
  const genreOptions = useMemo(() => {
    const labels = gameList.flatMap(getGenreLabels)
    return [...new Set(labels)].filter(Boolean)
  }, [gameList])
  const filteredGames = useMemo(() => {
    const keyword = gameSearchTerm.trim().toLowerCase()
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
  }, [gameList, gameSearchTerm, playerCountFilter, selectedGenres])

  const normalizeVietnamese = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
  }

  const filteredUsers = useMemo(() => {
    const search = normalizeVietnamese(userSearchTerm.trim())

    return userList.filter(user =>
      normalizeVietnamese(user.name).includes(search)
    )
  }, [userList, userSearchTerm])

  function isPlayerSelected(name, exceptPlayerId = null) {
    return players.some((player) => (
      player.id !== exceptPlayerId && player.name.trim().toLowerCase() === name.trim().toLowerCase()
    ))
  }

  function handleChooseGame(game) {
    selectGame(game)
    setSelectedUserIds([])
    if (onChooseGame) {
      onChooseGame(game)
      return
    }
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
    setGameSearchTerm('')
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
      toast('Can it nhat 2 người chơi')
      return
    }
    onStart()
  }

  function toggleUserSelection(user) {
    const userId = user.id
    setSelectedUserIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ))
    setSelectedUsersById((current) => {
      if (!current[userId]) return { ...current, [userId]: user }

      const next = { ...current }
      delete next[userId]
      return next
    })
  }

  function handleAddSelectedPlayers() {
    if (selectedUserIds.length === 0) {
      toast('Vui long chon người chơi')
      return
    }

    selectedUserIds.forEach((userId) => {
      const user = selectedUsersById[userId] || userList.find((item) => item.id === userId)
      if (user && !isPlayerSelected(user.name)) addPlayer(user.name, user.id, user.avatar_url)
    })
    setSelectedUserIds([])
    setSelectedUsersById({})
    setUserSearchTerm('')
    setSetupStep('config')
  }

  function openPlayerPicker() {
    if (players.length >= maxPlayersAllowed) return
    setSelectedUserIds([])
    setSelectedUsersById({})
    setUserSearchTerm('')
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
                  value={gameSearchTerm}
                  onChange={(event) => setGameSearchTerm(event.target.value)}
                  placeholder="Tìm trò chơi"
                  aria-label="Tìm tên game"
                />
                {gameSearchTerm ? (
                  <button
                    className="search-clear-button search-clear-button--with-filter"
                    type="button"
                    onClick={() => setGameSearchTerm('')}
                    aria-label="Xoa tu khoa tim game"
                  >
                    ✕
                  </button>
                ) : null}
                <span className="search-divider" aria-hidden="true" />
                <button
                  className={`filter-button${isFilterOpen ? ' active' : ''}`}
                  type="button"
                  onClick={() => setIsFilterOpen((value) => !value)}
                  aria-label="Bo loc"
                >
                  <Image src='/filter-icon.svg' alt='' width={24} height={24} />
                </button>
              </div>

              {isFilterOpen ? (
                <div className="filter-panel">
                  <label className="filter-field">
                    <span>So người chơi</span>
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
                <div className="home-game-list" aria-busy="true" aria-label="Đang tải...">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="game-card game-card-skeleton">
                      <div className="game-card-thumb" aria-hidden="true" />
                      <div className="game-card-info">
                        <span className="game-card-skeleton-line title" />
                        <span className="game-card-skeleton-line" />
                        <span className="game-card-skeleton-line short" />
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
                      <GameCard
                        type="button"
                        key={game.id || game.name}
                        title={game.name}
                        thumbnailUrl={game.thumbnail_url}
                        fallbackText={game.name?.slice(0, 2).toUpperCase() || 'BG'}
                        background={`linear-gradient(135deg, ${startColor}, ${endColor})`}
                        onClick={() => handleChooseGame(game)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <p>{formatPlayerRange(game)}</p>
                        {genres.length > 0 ? <p>{genres.join(', ')}</p> : null}
                      </GameCard>
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
            <h1>Chọn Người Chơi</h1>
            <button className="picker-close-btn" onClick={() => setSetupStep('config')} aria-label="Dong">
              <Image src="/close-icon.svg" alt='' width={32} height={32} />
            </button>
          </header>



          <div className="screen-inner player-picker-content">
            <section className="home-search-panel" >
              <div className="search-bar search-bar--plain">
                <span className="search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M16.5 16.5L21 21" />
                  </svg>
                </span>
                <input
                  value={userSearchTerm}
                  onChange={(event) => setUserSearchTerm(event.target.value)}
                  placeholder="Tìm người chơi"
                  aria-label="Tìm người chơi"
                />
                {userSearchTerm ? (
                  <button
                    className="search-clear-button"
                    type="button"
                    onClick={() => setUserSearchTerm('')}
                    aria-label="Xoa tu khoa tim nguoi choi"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            </section>

            <div className="player-picker-list">
              {filteredUsers.map((user) => {
                const selected = isPlayerSelected(user.name)
                const checked = selectedUserIds.includes(user.id)
                const disabled = selected || (isPickerAtMaxPlayers && !checked)

                return (
                  <label key={user.id} className={`player-picker-row ${selected ? 'selected' : ''}${disabled ? ' disabled' : ''}`}>
                    <div className="setup-player-row-left">
                      <Image src={user.avatar_url ? user.avatar_url : '/avatar-default.svg'} alt='' width={28} height={28} />
                      <span>{user.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleUserSelection(user)}
                    />
                  </label>
                )
              })}
              {!isLoadingUsers && filteredUsers.length === 0 ? (
                <div className="paper-card empty-state">{userList.length === 0 ? 'Khong tim thay nguoi choi.' : 'Khong tim thay nguoi choi phu hop.'}</div>
              ) : null}
            </div>
          </div>

          <div className="player-picker-footer">
            <button className="player-picker-submit" onClick={handleAddSelectedPlayers}>
              Thêm người chơi
            </button>
          </div>
        </>
      ) : (
        <>
          <header className="setup-topbar">
            <button
              className="setup-back-btn"
              onClick={() => {
                if (onBackFromConfig) {
                  onBackFromConfig()
                  return
                }
                setSetupStep('games')
              }}
              aria-label="Quay lai"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6 9 12l6 6" />
                <path d="M10 12h9" />
              </svg>
            </button>
            <h1>{selectedGame?.name || gameName || 'Chưa chọn trò chơi'}</h1>
          </header>

          <div className="screen-inner setup-flow">
            <section className="setup-section">
              <h2>Người chơi</h2>
              <div className="setup-row-list">
                <AnimatePresence initial={false}>
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="setup-player-row"
                    >
                      <div className="setup-player-row-left">
                        <Image src={player.avatar_url ? player.avatar_url : '/avatar-default.svg'} alt='' width={28} height={28} />
                        <span>{player.name}</span>

                      </div>

                      <button className="setup-circle-btn remove" onClick={() => removePlayer(player.id)} aria-label={`Xoa ${player.name}`}>
                        <Image src="/minus-icon.svg" alt="" width={24} height={24} />
                      </button>
                    </div>
                  ))}
                </AnimatePresence>

                <button className="setup-player-row add" onClick={openPlayerPicker} disabled={players.length >= maxPlayersAllowed}>
                  <span>Thêm người chơi</span>
                  <Image src="/plus-icon.svg" alt="" width={24} height={24} />
                </button>
              </div>
            </section>

            <section className="setup-section">
              <h2>Ngày giờ</h2>
              <div className="setup-date-row">
                <span>{formatPlayDateTime(playDateTime)}</span>
                <label className="setup-date-button" aria-label="Chon ngay gio">
                  <Image src="/datetime.svg" alt="" width={24} height={24} />
                  <input
                    type="datetime-local"
                    value={playDateTime}
                    onChange={(event) => setPlayDateTime(event.target.value)}
                  />
                </label>
              </div>
            </section>

            <button className="setup-start-btn" onClick={handleStart}>
              Tạo bảng điểm
            </button>
          </div>
        </>
      )
      }
    </div >
  )
}
