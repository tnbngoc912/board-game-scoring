import React, { useMemo } from 'react'
import '../../styles/components/match-factions-list.css'

export function MatchFactionsList({ players = [], factions = [] }) {
  const factionsMap = useMemo(() => {
    const map = new Map()
    ;(factions || []).forEach((f) => {
      if (f && f.id) map.set(f.id, f)
    })
    return map
  }, [factions])

  const playersWithFaction = useMemo(() => {
    return (players || []).filter((p) => Boolean(p.faction_id))
  }, [players])

  if (playersWithFaction.length === 0) {
    return null
  }

  return (
    <section className="match-factions-card" aria-label="Phe hoặc nhân vật">
      <div className="match-factions-header">
        <h3 className="match-factions-title">Phe / Nhân vật</h3>
      </div>
      <div className="match-factions-grid">
        {playersWithFaction.map((player) => {
          const faction = factionsMap.get(player.faction_id)
          const factionName = faction?.name || player.faction_id
          const factionColor = faction?.color

          return (
            <div key={player.id} className="match-factions-item">
              <span className="match-factions-player-name" title={player.name}>
                {player.name}
              </span>
              <span
                className="match-factions-badge"
                title={factionName}
                style={
                  factionColor
                    ? {
                        color: factionColor,
                        backgroundColor: `${factionColor}18`,
                        borderColor: `${factionColor}35`,
                      }
                    : undefined
                }
              >
                {factionColor && (
                  <i
                    className="match-factions-badge-dot"
                    style={{ backgroundColor: factionColor }}
                    aria-hidden="true"
                  />
                )}
                {factionName}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
