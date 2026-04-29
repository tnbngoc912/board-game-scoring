import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

export function RoundHistory({ onUndo, toast }) {
  const [open, setOpen] = useState(false)
  const { players, rounds, undoLastRound } = useGameStore()

  function handleUndo() {
    if (!rounds.length) return
    undoLastRound()
    toast('Last round undone')
  }

  if (!rounds.length) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 0,
          }}
        >
          {open ? '▲' : '▼'} Round history ({rounds.length})
        </button>

        <button
          onClick={handleUndo}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--danger)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            padding: 0,
          }}
        >
          ↩ Undo last
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
                minWidth: players.length > 4 ? players.length * 70 : 'auto',
              }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      color: 'var(--text3)',
                      fontWeight: 600,
                      borderBottom: '1px solid var(--border)',
                      fontFamily: 'var(--font-display)',
                    }}>
                      Round
                    </th>
                    {players.map(p => (
                      <th key={p.id} style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        color: p.color,
                        fontWeight: 600,
                        borderBottom: '1px solid var(--border)',
                        fontFamily: 'var(--font-display)',
                      }}>
                        {p.initials || p.name.slice(0, 2).toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((round, i) => (
                    <tr key={round.id}>
                      <td style={{
                        padding: '8px 12px',
                        color: 'var(--text3)',
                        borderBottom: i < rounds.length - 1 ? '1px solid var(--border)' : 'none',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 500,
                      }}>
                        R{i + 1}
                      </td>
                      {players.map(p => {
                        const val = round.scores[p.id] ?? 0
                        return (
                          <td key={p.id} style={{
                            padding: '8px 12px',
                            textAlign: 'right',
                            borderBottom: i < rounds.length - 1 ? '1px solid var(--border)' : 'none',
                            color: val > 0 ? 'var(--success)' : val < 0 ? 'var(--danger)' : 'var(--text3)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                          }}>
                            {val > 0 ? '+' : ''}{val}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr style={{ background: 'var(--bg3)' }}>
                    <td style={{
                      padding: '10px 12px',
                      fontWeight: 700,
                      fontSize: 12,
                      color: 'var(--text2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Total
                    </td>
                    {players.map(p => {
                      const total = rounds.reduce((s, r) => s + (r.scores[p.id] ?? 0), 0)
                      return (
                        <td key={p.id} style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text)',
                        }}>
                          {total}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
