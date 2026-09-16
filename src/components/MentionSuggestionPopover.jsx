import React from 'react'

export function MentionSuggestionPopover({ players = [], onSelect }) {
  if (!players || players.length === 0) return null

  return (
    <div className="mention-suggestion-popover" role="listbox" aria-label="Gợi ý người chơi để tag">
      <div className="mention-suggestion-header">
        <span>Gợi ý tag ({players.length})</span>
      </div>
      <div className="mention-suggestion-list">
        {players.map((player) => (
          <button
            key={player.id}
            type="button"
            className="mention-suggestion-item"
            onClick={() => onSelect?.(player)}
          >
            <div className="mention-suggestion-avatar">
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt={player.name}
                  className="mention-suggestion-avatar-img"
                />
              ) : (
                <span className="mention-suggestion-avatar-initial">
                  {player.name ? player.name.slice(0, 1).toUpperCase() : '?'}
                </span>
              )}
            </div>
            <div className="mention-suggestion-info">
              <span className="mention-suggestion-name">{player.name}</span>
              <span className="mention-suggestion-sub">Người chơi trong ván</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
