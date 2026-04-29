import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { PlayerDot } from './PlayerDot'

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value)
  const [animating, setAnimating] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value === prevRef.current) return
    const diff = value - prevRef.current
    const steps = 12
    const stepVal = diff / steps
    let step = 0
    setAnimating(true)
    const interval = setInterval(() => {
      step++
      setDisplay(Math.round(prevRef.current + stepVal * step))
      if (step >= steps) {
        clearInterval(interval)
        setDisplay(value)
        setAnimating(false)
        prevRef.current = value
      }
    }, 25)
    return () => clearInterval(interval)
  }, [value])

  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: '-1px',
        color: animating ? 'var(--accent)' : 'var(--text)',
        transition: 'color .3s',
        display: 'inline-block',
        animation: animating ? 'scorePop .4s cubic-bezier(.34,1.56,.64,1)' : 'none',
      }}
    >
      {display}
    </span>
  )
}

const RANK_ICONS = ['👑', '🥈', '🥉']

export function Leaderboard({ roundCount }) {
  const { getTotals, rounds } = useGameStore()
  const totals = getTotals()

  return (
    <div style={{ marginBottom: 16 }}>
      <AnimatePresence>
        {totals.map((player, i) => {
          const lastDelta = rounds.length > 0
            ? (rounds[rounds.length - 1].scores[player.id] ?? 0)
            : null

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28, layout: { type: 'spring', stiffness: 300, damping: 30 } }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: i === 0
                  ? `linear-gradient(135deg, rgba(232,197,71,.1), var(--bg2))`
                  : 'var(--bg2)',
                border: `1px solid ${i === 0 ? 'rgba(232,197,71,.3)' : 'var(--border)'}`,
                borderRadius: 'var(--r)',
                marginBottom: 8,
              }}
            >
              {/* Rank */}
              <div style={{
                width: 28,
                textAlign: 'center',
                fontSize: i < 3 ? 18 : 13,
                color: 'var(--text3)',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {i < 3 ? RANK_ICONS[i] : `#${i + 1}`}
              </div>

              {/* Avatar */}
              <PlayerDot player={player} size={38} />

              {/* Name + delta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {player.name}
                </div>
                {lastDelta !== null && lastDelta !== 0 && (
                  <motion.div
                    key={`${player.id}-${rounds.length}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: lastDelta > 0 ? 'var(--success)' : 'var(--danger)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {lastDelta > 0 ? '+' : ''}{lastDelta} this round
                  </motion.div>
                )}
              </div>

              {/* Score */}
              <AnimatedNumber value={player.total} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
