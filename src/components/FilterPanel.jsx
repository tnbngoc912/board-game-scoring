import React from 'react'
import { Select } from './ui/Select'

export function FilterPanel({ playerCountFilter, setPlayerCountFilter }) {
  const handleClear = () => {
    setPlayerCountFilter('')
  }

  const options = [
    { value: '', label: 'Tất cả' },
    { value: '1', label: '1 người' },
    { value: '2', label: '2 người' },
    { value: '3', label: '3 người' },
    { value: '4', label: '4 người' },
    { value: '5', label: '5 người' },
    { value: '6', label: '6 người' },
    { value: '7', label: '7 người' },
    { value: '8', label: '8 người' },
  ]

  return (
    <div className="filter-panel">
      <div className="filter-field">
        <span>SỐ LƯỢNG NGƯỜI CHƠI</span>
        <Select
          value={playerCountFilter}
          onChange={setPlayerCountFilter}
          options={options}
        />
      </div>
      <button
        type="button"
        className="filter-clear-button"
        onClick={handleClear}
      >
        Xóa bộ lọc
      </button>
    </div>
  )
}
