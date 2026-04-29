import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerDot } from './PlayerDot'
import { getBoardGames } from '../api/backendService'

const CUSTOM_PLAYER_VALUE = '__custom__'

function capitalizeFirstLetter(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function SetupScreen({ onStart, onShowHistory, toast }) {
  const [newPlayerChoice, setNewPlayerChoice] = useState('')
  const [customPlayerName, setCustomPlayerName] = useState('')
  const [customPlayerIds, setCustomPlayerIds] = useState(() => new Set())
  const [categoryName, setCategoryName] = useState('')
  const {
    gameName,
    players,
    categories,
    history,
    selectGame,
    addPlayer,
    removePlayer,
    updatePlayerName,
    addCategory,
    removeCategory,
  } = useGameStore()

  const [gameList, setGameList] = useState([])
  const [isLoadingGames, setIsLoadingGames] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadGames() {
      setIsLoadingGames(true)
      try {
        const games = await getBoardGames()
        if (isMounted) setGameList(games)
      } catch {
        toast('Khong tai duoc danh sach game')
      } finally {
        if (isMounted) setIsLoadingGames(false)
      }
    }

    loadGames()

    return () => {
      isMounted = false
    }
  }, [toast])

  const canStart = players.length >= 2 && players.every((player) => player.name.trim()) && categories.length >= 1
  const selectedGame = useMemo(
    () => gameList.find((game) => game.name === gameName) || null,
    [gameList, gameName]
  )
  const playerOptions = useMemo(
    () => [...new Set([
      ...players.map((player) => player.name),
      ...history.flatMap((entry) => entry.players?.map((player) => player.name) || []),
    ].map((name) => name.trim()).filter(Boolean))],
    [history, players]
  )

  function isPlayerSelected(name, exceptPlayerId = null) {
    return players.some((player) => (
      player.id !== exceptPlayerId && player.name.trim().toLowerCase() === name.trim().toLowerCase()
    ))
  }

  function handleAddPlayer(name = customPlayerName) {
    if (isPlayerSelected(name)) {
      toast('Nguoi choi da co trong danh sach')
      return
    }

    if (!addPlayer(name)) return
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
    handleAddPlayer(value)
  }

  function handleAddCategory(name = categoryName) {
    if (!addCategory(name)) return
    setCategoryName('')
  }

  function handleGameChange(value) {
    const nextGame = gameList.find((game) => game.name === value)
    selectGame(nextGame)
    setCategoryName('')
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

    if (isPlayerSelected(value, playerId)) {
      toast('Nguoi choi da co trong danh sach')
      return
    }

    updatePlayerName(playerId, value)
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
        <section className="paper-card">
          <div className="card-heading">🎮 Ten tro choi</div>
          <select
            className="demo-input"
            name="games"
            value={selectedGame?.name || ''}
            onChange={(e) => handleGameChange(e.target.value)}
          >
            <option value="">{isLoadingGames ? 'Dang tai game...' : 'Chon tro choi'}</option>
            {gameList.map((game) => (
              <option key={game.id} value={game.name}>
                {game.name}
              </option>
            ))}
          </select>
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
                      value={customPlayerIds.has(player.id) || !playerOptions.includes(player.name) ? CUSTOM_PLAYER_VALUE : player.name}
                      onChange={(e) => handlePlayerChoice(player.id, e.target.value)}
                    >
                      <option value="">Chon nguoi choi</option>
                      {playerOptions.map((name) => (
                        <option key={name} value={name} disabled={isPlayerSelected(name, player.id)}>
                          {name}
                        </option>
                      ))}
                      <option value={CUSTOM_PLAYER_VALUE}>Nhap nguoi choi moi</option>
                    </select>
                    {(customPlayerIds.has(player.id) || !playerOptions.includes(player.name)) ? (
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
                <option value="">Them nguoi choi</option>
                {playerOptions.map((name) => (
                  <option key={name} value={name} disabled={isPlayerSelected(name)}>
                    {name}
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
      </div>
    </div>
  )
}
