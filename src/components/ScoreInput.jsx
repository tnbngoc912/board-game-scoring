import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerDot } from './PlayerDot'

const PRESETS = [
  { label: '+1', val: 1 },
  { label: '+5', val: 5 },
  { label: '+10', val: 10 },
  { label: '+25', val: 25 },
]

export function ScoreInput({
  onConfirm,
  toast,
  title = 'Scores',
  confirmLabel = 'Confirm',
  clearLabel = 'Clear',
  bulkLabel = 'Add to all',
}) {
  const { players } = useGameStore()
  const [scores, setScores] = useState({})

  // Reset when players change
  useEffect(() => {
    setScores(prev => {
      const next = {}
      players.forEach(p => { next[p.id] = prev[p.id] ?? 0 })
      return next
    })
  }, [players])

  function setScore(id, val) {
    const num = parseInt(val, 10)
    setScores(s => ({ ...s, [id]: isNaN(num) ? 0 : num }))
  }

  function step(id, dir) {
    setScores(s => ({ ...s, [id]: (s[id] ?? 0) + dir }))
  }

  function applyPreset(val) {
    setScores(s => {
      const next = {}
      players.forEach(p => { next[p.id] = (s[p.id] ?? 0) + val })
      return next
    })
    toast(`+${val} added to all`)
  }

  function clearAll() {
    const next = {}
    players.forEach(p => { next[p.id] = 0 })
    setScores(next)
  }

  function handleConfirm() {
    onConfirm(scores)
    clearAll()
  }

  const hasAnyScore = Object.values(scores).some(v => v !== 0)

  return (
    <div>
      {/* Preset buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {PRESETS.map(p => (
          <button
            key={p.val}
            onClick={() => applyPreset(p.val)}
            style={{
              flex: 1,
              padding: '8px 4px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--rs)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text2)',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              transition: 'all .1s',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(.93)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={clearAll}
          style={{
            flex: 1,
            padding: '8px 4px',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--rs)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text3)',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            transition: 'all .1s',
          }}
        >
          ✕ {clearLabel}
        </button>
      </div>

      {/* Per-player inputs */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ padding: '10px 14px 4px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {title}
          </span>
        </div>

        {players.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderBottom: i < players.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <PlayerDot player={player} size={32} />

            <span style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 100,
            }}>
              {player.name}
            </span>

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StepBtn dir={-1} onClick={() => step(player.id, -1)} />

              <input
                type="number"
                value={scores[player.id] ?? 0}
                onChange={e => setScore(player.id, e.target.value)}
                inputMode="numeric"
                style={{
                  width: 58,
                  background: 'var(--bg3)',
                  border: `1.5px solid ${(scores[player.id] ?? 0) !== 0 ? 'var(--accent)' : 'var(--border2)'}`,
                  borderRadius: 'var(--rss)',
                  padding: '7px 4px',
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: (scores[player.id] ?? 0) < 0 ? 'var(--danger)' : (scores[player.id] ?? 0) > 0 ? 'var(--success)' : 'var(--text)',
                  outline: 'none',
                  transition: 'border-color .15s, color .15s',
                }}
              />

              <StepBtn dir={1} onClick={() => step(player.id, 1)} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confirm button */}
      <button
        className="btn-primary"
        onClick={handleConfirm}
        style={{ opacity: hasAnyScore ? 1 : 0.5 }}
      >
        {hasAnyScore ? `✓ ${confirmLabel}` : `${confirmLabel} (all zero)`}
      </button>
    </div>
  )
}

function StepBtn({ dir, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: 'var(--rss)',
        background: 'var(--bg3)',
        border: '1.5px solid var(--border)',
        color: 'var(--text)',
        fontSize: 22,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all .1s',
        userSelect: 'none',
        fontFamily: 'var(--font-display)',
      }}
      onMouseDown={e => {
        e.currentTarget.style.transform = 'scale(.85)'
        e.currentTarget.style.borderColor = dir > 0 ? 'var(--success)' : 'var(--danger)'
        e.currentTarget.style.color = dir > 0 ? 'var(--success)' : 'var(--danger)'
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--text)'
      }}
      onTouchStart={e => {
        e.currentTarget.style.transform = 'scale(.85)'
        e.currentTarget.style.borderColor = dir > 0 ? 'var(--success)' : 'var(--danger)'
      }}
      onTouchEnd={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.borderColor = 'var(--border)'
        onClick()
      }}
    >
      {dir > 0 ? '+' : '−'}
    </button>
  )
}
