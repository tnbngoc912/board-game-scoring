import React from 'react'

export function PlayerDot({ player, size = 38 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: player.color,
        flexShrink: 0,
        border: '2px solid rgba(255,255,255,0.95)',
        boxShadow: '0 3px 10px rgba(120, 80, 44, 0.18)',
      }}
    />
  )
}
