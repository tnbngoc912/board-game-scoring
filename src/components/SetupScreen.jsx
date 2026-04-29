import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerDot } from './PlayerDot'

export function SetupScreen({ onStart, onShowHistory, toast }) {
  const [playerName, setPlayerName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const {
    gameName,
    players,
    categories,
    setGameName,
    addPlayer,
    removePlayer,
    addCategory,
    removeCategory,
  } = useGameStore()

  const canStart = players.length >= 2 && categories.length >= 1
  const placeholder = useMemo(() => 'VD: Wingspan, Terraforming Mars', [])

  function handleAddPlayer(name = playerName) {
    if (!addPlayer(name)) return
    setPlayerName('')
  }

  function handleAddCategory(name = categoryName) {
    if (!addCategory(name)) return
    setCategoryName('')
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
          <input
            className="demo-input"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder={placeholder}
          />
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
                  <div className="stack-row-label">{player.name}</div>
                  <button className="remove-chip" onClick={() => removePlayer(player.id)}>×</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="inline-form">
            <input
              className="demo-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
              placeholder="Them nguoi choi"
            />
            <button className="secondary-mini" onClick={() => handleAddPlayer()}>+ Them</button>
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
                  <div className="stack-row-label">{category.name}</div>
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
