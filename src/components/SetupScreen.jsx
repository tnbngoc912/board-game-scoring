import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../store/gameStore'
import { useAppDataStore } from '../store/appDataStore'
import { LoadingOverlay } from './LoadingOverlay'
import { GameCard } from './GameCard'
import Image from "next/image"
import { Header } from './Header'
import { FilterPanel } from './FilterPanel'
import { SearchBar } from './ui/SearchBar'
import { EmptyState } from './ui/EmptyState'
import { PullToRefresh } from './ui/PullToRefresh'
import { usePermissions } from '../hooks/usePermissions'
import { Icon } from './ui/Icon'
import { Button } from './ui/Button'
import { NotificationPrompt } from './notifications/NotificationPrompt'

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

function getCurrentLocalDateTimeValue() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function SetupScreen({ onStart, homeResetToken, toast, initialStep = 'games', onBackFromConfig, onChooseGame }) {
  const [setupStep, setSetupStep] = useState(initialStep)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.navigator.standalone || 
                         window.matchMedia('(display-mode: standalone)').matches ||
                         new URLSearchParams(window.location.search).get('test-pwa') === 'true'
      setIsStandalone(standalone)
    }
  }, [])

  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [setupStep])

  const [gameSearchTerm, setGameSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [playerCountFilter, setPlayerCountFilter] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [selectedUsersById, setSelectedUsersById] = useState({})
  const { gameName, players, categories, selectGame, addPlayer, removePlayer, playDateTime, setPlayDateTime } = useGameStore(
    useShallow((state) => ({
      gameName: state.gameName,
      players: state.players,
      categories: state.categories,
      selectGame: state.selectGame,
      addPlayer: state.addPlayer,
      removePlayer: state.removePlayer,
      playDateTime: state.playDateTime,
      setPlayDateTime: state.setPlayDateTime,
    }))
  )

  const {
    gameList,
    userList,
    isLoadingGames,
    isLoadingMoreBoardGames,
    boardGamesHasMore,
    isLoadingUsers,
    fetchBoardGames,
    fetchMoreBoardGames,
    fetchUsers,
  } = useAppDataStore(
    useShallow((state) => ({
      gameList: state.boardGames,
      userList: state.users,
      isLoadingGames: state.isLoadingBoardGames,
      isLoadingMoreBoardGames: state.isLoadingMoreBoardGames,
      boardGamesHasMore: state.boardGamesHasMore,
      isLoadingUsers: state.isLoadingUsers,
      fetchBoardGames: state.fetchBoardGames,
      fetchMoreBoardGames: state.fetchMoreBoardGames,
      fetchUsers: state.fetchUsers,
    }))
  )

  const { match } = usePermissions()
  const { canCreate } = match

  useEffect(() => {
    async function loadSetupData() {
      try {
        await Promise.all([fetchBoardGames(), fetchUsers()])
      } catch {
        toast('Không tải được dữ liệu')
      }
    }

    loadSetupData()
  }, [fetchBoardGames, fetchUsers, toast])

  useEffect(() => {
    setSetupStep(initialStep)
  }, [homeResetToken, initialStep])

  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const timer = setTimeout(() => {
      fetchBoardGames({
        force: true,
        page: 1,
        limit: 10,
        search: gameSearchTerm.trim() || undefined,
        playerCount: playerCountFilter || undefined,
      }).catch(() => {
        toast('Không tải được danh sách trò chơi')
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [gameSearchTerm, playerCountFilter, fetchBoardGames, toast])

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

  const filteredGames = gameList
  const hasGameFilters = Boolean(gameSearchTerm.trim() || playerCountFilter)

  const canLoadMoreGames = Boolean(
    setupStep === 'games' &&
    boardGamesHasMore &&
    !isLoadingGames &&
    gameList.length >= 10
  )

  const sentinelGamesRef = useRef(null)

  useEffect(() => {
    if (!canLoadMoreGames) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && canLoadMoreGames && !isLoadingMoreBoardGames) {
          fetchMoreBoardGames({ limit: 10 }).catch(() => {})
        }
      },
      {
        root: null,
        rootMargin: '150px',
        threshold: 0,
      }
    )

    const el = sentinelGamesRef.current
    if (el) observer.observe(el)

    const scrollContainer = el?.closest('.pull-to-refresh-container') || (typeof window !== 'undefined' ? window : null)
    const handleScroll = () => {
      if (!canLoadMoreGames || isLoadingMoreBoardGames || isLoadingGames) return
      const target = scrollContainer === window ? document.documentElement : scrollContainer
      if (!target) return
      const scrollTop = scrollContainer === window ? window.scrollY : target.scrollTop
      const scrollHeight = target.scrollHeight
      const clientHeight = scrollContainer === window ? window.innerHeight : target.clientHeight

      if (scrollHeight > clientHeight + 100 && scrollHeight - (scrollTop + clientHeight) < 250) {
        fetchMoreBoardGames({ limit: 10 }).catch(() => {})
      }
    }

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (el) observer.unobserve(el)
      observer.disconnect()
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [canLoadMoreGames, isLoadingMoreBoardGames, isLoadingGames, fetchMoreBoardGames])

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

  const isPlayerSelected = useCallback((name, exceptPlayerId = null) => {
    return players.some((player) => (
      player.id !== exceptPlayerId && player.name.trim().toLowerCase() === name.trim().toLowerCase()
    ))
  }, [players])

  const handleChooseGame = useCallback((game) => {
    selectGame(game)
    setSelectedUserIds([])
    if (onChooseGame) {
      onChooseGame(game)
      return
    }
    setSetupStep('config')
  }, [onChooseGame, selectGame])

  const toggleGenre = useCallback((genre) => {
    setSelectedGenres((current) => (
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    ))
  }, [])

  const resetFilters = useCallback(() => {
    setGameSearchTerm('')
    setPlayerCountFilter('')
    setSelectedGenres([])
  }, [])

  function formatPlayDateTime(value) {
    if (!value) return ''
    const [datePart, timePart] = value.split('T')
    const [year, month, day] = datePart.split('-')
    return `${timePart}, ${day}/${month}/${year}`
  }

  const handleStart = useCallback(() => {
    if (!canStart) {
      toast('Cần ít nhất 2 người chơi')
      return
    }
    onStart()
  }, [canStart, onStart, toast])

  const toggleUserSelection = useCallback((user) => {
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
  }, [])

  const handleAddSelectedPlayers = useCallback(() => {
    if (selectedUserIds.length === 0) {
      toast('Vui lòng chọn người chơi')
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
  }, [addPlayer, isPlayerSelected, selectedUserIds, selectedUsersById, toast, userList])

  const openPlayerPicker = useCallback(() => {
    if (players.length >= maxPlayersAllowed) return
    setSelectedUserIds([])
    setSelectedUsersById({})
    setUserSearchTerm('')
    setSetupStep('player-picker')
  }, [maxPlayersAllowed, players.length])


  return (
    <div className={`screen${setupStep === 'games' ? ' home-screen' : ''}${setupStep === 'games' && isStandalone ? ' has-ptr' : ''}`}>
      {setupStep === 'games' ? (
        <>
          <Header />

          <PullToRefresh onRefresh={async () => {
            try {
              await Promise.all([
                fetchBoardGames({ force: true }),
                fetchUsers({ force: true })
              ])
            } catch (err) {
              toast('Không thể làm mới dữ liệu')
            }
          }}>
            <div className="screen-inner home-content">
              <NotificationPrompt toast={toast} activeStep={setupStep} />

              <section className="home-search-panel" aria-label="Tim va loc game">
                <SearchBar
                  value={gameSearchTerm}
                  onChange={(event) => setGameSearchTerm(event.target.value)}
                  onClear={() => setGameSearchTerm('')}
                  placeholder="Tìm trò chơi"
                  isFilterOpen={isFilterOpen}
                  onFilterToggle={() => setIsFilterOpen((value) => !value)}
                  hasFilters={Boolean(playerCountFilter || selectedGenres.length > 0)}
                />
                <FilterPanel
                  playerCountFilter={playerCountFilter}
                  setPlayerCountFilter={setPlayerCountFilter}
                  isOpen={isFilterOpen}
                />
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
                  <EmptyState
                    imageSrc="/not-found.png"
                    title="Không tìm thấy kết quả nào!"
                    actionText="Xóa bộ lọc"
                    onAction={resetFilters}
                  />
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
                        >
                          <p>{formatPlayerRange(game)}</p>
                          {genres.length > 0 ? <p>{genres.join(', ')}</p> : null}
                        </GameCard>
                      )
                    })}

                    {canLoadMoreGames && isLoadingMoreBoardGames ? (
                      <>
                        {Array.from({ length: 2 }).map((_, index) => (
                          <div key={`more-game-skeleton-${index}`} className="game-card game-card-skeleton" aria-hidden="true">
                            <div className="game-card-thumb" />
                            <div className="game-card-info">
                              <span className="game-card-skeleton-line title" />
                              <span className="game-card-skeleton-line" />
                              <span className="game-card-skeleton-line short" />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : null}

                    {canLoadMoreGames ? (
                      <div ref={sentinelGamesRef} className="history-scroll-sentinel" aria-hidden="true" style={{ height: 1, margin: 0, padding: 0 }} />
                    ) : null}
                  </div>
                ) : null}
              </section>
            </div>
          </PullToRefresh>
        </>
      ) : setupStep === 'player-picker' ? (
        <>
          <Header title="Chọn Người Chơi" onClose={() => setSetupStep('config')} />

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
          <Header
            title={selectedGame?.name || gameName || 'Chưa chọn trò chơi'}
            onBack={() => {
              if (onBackFromConfig) {
                onBackFromConfig()
                return
              }
              setSetupStep('games')
            }}
          />

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
              <label className="setup-date-row">
                <span>{formatPlayDateTime(playDateTime || getCurrentLocalDateTimeValue())}</span>
                <div className="setup-date-button" aria-label="Chon ngay gio">
                  <Image src="/datetime.svg" alt="" width={24} height={24} />
                  <input
                    type="datetime-local"
                    value={playDateTime}
                    onChange={(event) => setPlayDateTime(event.target.value)}
                  />
                </div>
              </label>
            </section>

            {canCreate && (
              <button className="setup-start-btn" onClick={handleStart}>
                Tạo bảng điểm
              </button>
            )}
          </div>
        </>
      )
      }
    </div >
  )
}
