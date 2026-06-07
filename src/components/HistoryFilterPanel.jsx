import React from 'react'
import { Select } from './ui/Select'
import { Button } from './ui/Button'

export function HistoryFilterPanel({
  selectedGameName,
  setSelectedGameName,
  gameOptions,
  selectedPlayerName,
  setSelectedPlayerName,
  playerOptions,
  myMatchesOnly,
  setMyMatchesOnly,
  onClear,
  isOpen,
}) {
  const gameSelectOptions = [
    { value: '', label: 'Tất cả' },
    ...gameOptions.map((name) => ({ value: name, label: name })),
  ]

  const playerSelectOptions = [
    { value: '', label: 'Tất cả' },
    ...playerOptions.map((name) => ({ value: name, label: name })),
  ]

  const isClearDisabled = !selectedGameName && !selectedPlayerName && !myMatchesOnly

  return (
    <div className={`filter-panel history-filter-panel ${isOpen ? 'open' : ''}`}>
      <div className="filter-panel-inner">
        <div className="filter-field">
          <span>TỰA GAME</span>
          <Select
            value={selectedGameName}
            onChange={setSelectedGameName}
            options={gameSelectOptions}
            searchable={true}
            searchPlaceholder="Tìm tựa game..."
          />
        </div>

        <div className="history-filter-row">
          <div className="filter-field history-player-field">
            <span>NGƯỜI CHƠI</span>
            <Select
              value={selectedPlayerName}
              onChange={setSelectedPlayerName}
              options={playerSelectOptions}
              searchable={true}
              searchPlaceholder="Tìm người chơi..."
            />
          </div>

          <div className="filter-field history-toggle-field">
            <span>VÁN CÓ TÔI</span>
            <label className="toggle-switch" aria-label="Lọc ván có tôi tham gia">
              <input
                type="checkbox"
                checked={myMatchesOnly}
                onChange={(e) => setMyMatchesOnly(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <Button
          variant="primary"
          className="history-clear-filter-btn"
          onClick={onClear}
          disabled={isClearDisabled}
        >
          Xóa bộ lọc
        </Button>
      </div>
    </div>
  )
}
