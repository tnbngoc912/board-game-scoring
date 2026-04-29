import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerDot } from './PlayerDot'
import { getBoardGames, getUsers } from '../api/backendService'

const CUSTOM_PLAYER_VALUE = '__custom__'

function capitalizeFirstLetter(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function SetupScreen({ onStart, onShowHistory, toast }) {
  const [setupStep, setSetupStep] = useState('games')
  const [pendingGame, setPendingGame] = useState(null)
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
    removeCategory,
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

  const canStart = players.length >= 2 && players.every((player) => player.name.trim()) && categories.length >= 1
  const selectedGame = useMemo(
    () => gameList.find((game) => game.name === gameName) || null,
    [gameList, gameName]
  )

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

  function handleChooseGame() {
    if (!pendingGame) {
      toast('Vui long chon tro choi')
      return
    }

    const game = pendingGame
    selectGame(game)
    setCategoryName('')
    setSetupStep('config')
  }

  function handleBackToGames() {
    setPendingGame(selectedGame)
    setSetupStep('games')
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
        <button className="demo-tab active">✏️ Van moi</button>
        <button className="demo-tab" onClick={onShowHistory}>📜 Lich su</button>
      </div>

      <div className="screen-inner demo-layout">
        {setupStep === 'games' ? (
          <section className="game-list-section">
            <div className="section-heading-row">
              <div>
                <div className="card-heading">🎮 Ten tro choi</div>
                <p className="section-note">Chon game de thiet lap nguoi choi va hang muc tinh diem.</p>
              </div>
            </div>

            <div className="game-card-list">
              {isLoadingGames ? (
                <div className="paper-card empty-state">Dang tai danh sach game...</div>
              ) : null}

              {!isLoadingGames && gameList.length === 0 ? (
                <div className="paper-card empty-state">Chua co game nao.</div>
              ) : null}

              {!isLoadingGames && gameList.map((game, index) => {
                const isSelected = pendingGame?.id === game.id || pendingGame?.name === game.name

                return (
                  <motion.button
                    type="button"
                    key={game.id || game.name}
                    className={`game-card${isSelected ? ' selected' : ''}`}
                    onClick={() => setPendingGame(game)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div className="game-card-image" aria-hidden="true">
                      <span>🎲</span>
                    </div>
                    <div className="game-card-body">
                      <h2 className="game-card-title">{game.name}</h2>
                      <div className="game-card-meta">{isSelected ? 'Da chon' : 'Cham de chon'}</div>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            <button
              className="btn-primary game-list-action"
              onClick={handleChooseGame}
              disabled={!pendingGame}
            >
              Di tiep
            </button>
          </section>
        ) : (
          <>
            <section className="paper-card setup-summary-card">
              <div>
                <div className="summary-label">Tro choi da chon</div>
                <div className="summary-title">{selectedGame?.name || gameName || 'Chua chon tro choi'}</div>
              </div>
              <button className="secondary-mini" onClick={handleBackToGames}>Doi game</button>
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
                      <PlayerDot player={player} size={34} />
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
                      <button className="remove-chip" onClick={() => removeCategory(category.id)}>×</button>
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
          </>
        )}
      </div>
    </div>
  )
}
