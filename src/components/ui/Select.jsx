import React, { useState, useEffect, useRef } from 'react'
import { Icon } from './Icon'

export function Select({ value, onChange, options, placeholder = 'Chọn...', searchable = false, searchPlaceholder = 'Tìm kiếm...' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === String(value)) || options.find((opt) => opt.value === '') || options[0]

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      // Đợi dropdown render hoàn chỉnh trước khi focus
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
    if (!isOpen) {
      setSearchTerm('')
    }
  }, [isOpen, searchable])

  const handleSelect = (val) => {
    if (onChange) {
      onChange(val)
    }
    setIsOpen(false)
  }

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    : options

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <Icon
          src="/down.png"
          color="#70655C"
          size={24}
          className="custom-select-arrow"
        />
      </button>

      {isOpen ? (
        <ul className="custom-select-options" role="listbox">
          {searchable && (
            <li className="custom-select-search-wrapper" onClick={(e) => e.stopPropagation()}>
              <input
                ref={searchInputRef}
                type="text"
                className="custom-select-search-input"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </li>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === String(value)}
                className={`custom-select-option ${opt.value === String(value) ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="custom-select-no-results">Không tìm thấy kết quả</li>
          )}
        </ul>
      ) : null}
    </div>
  )
}
