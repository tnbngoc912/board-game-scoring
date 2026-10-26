import React from 'react'
import { Select } from '../ui/Select'
import '../../styles/components/faction-selector.css'

export function FactionSelector({
  players = [],
  factions = [],
  playerFactions = {},
  onFactionChange,
}) {
  if (!factions || factions.length === 0 || !players || players.length === 0) {
    return null
  }

  return (
    <section className="faction-selector-card" aria-label="Chọn phe hoặc nhân vật">
      <div className="faction-selector-header">
        <div className="faction-selector-title-wrap">
          <h3 className="faction-selector-title">Chọn phe / Nhân vật</h3>
          <span className="faction-selector-badge">Bắt buộc</span>
        </div>
      </div>
      <p className="faction-selector-desc">
        Mỗi người chơi chọn 1 phe hoặc nhân vật riêng biệt cho ván đấu.
      </p>

      <div className="faction-selector-list">
        {players.map((player) => {
          const currentFactionId = playerFactions[player.id] || ''

          // Danh sách các phe đã được người khác chọn
          const takenFactionIds = new Set(
            players
              .filter((other) => other.id !== player.id && playerFactions[other.id])
              .map((other) => playerFactions[other.id])
          )

          const options = [
            { value: '', label: 'Chọn phe...' },
            ...factions.map((f) => {
              const isTaken = takenFactionIds.has(f.id)
              return {
                value: f.id,
                label: isTaken ? `${f.name} (Đã chọn)` : f.name,
                disabled: isTaken,
              }
            }),
          ]

          return (
            <div key={player.id} className="faction-selector-item">
              <span className="faction-selector-player-name" title={player.name}>
                {player.name}
              </span>

              <div className="faction-selector-control">
                <Select
                  value={currentFactionId}
                  options={options}
                  placeholder="Chọn phe..."
                  searchable={factions.length > 5}
                  searchPlaceholder="Tìm phe/nhân vật..."
                  onChange={(val) => onFactionChange && onFactionChange(player.id, val)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
