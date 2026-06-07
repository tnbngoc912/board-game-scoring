import React from 'react'
import clsx from 'clsx'
import { Icon } from './Icon'

/**
 * Component SearchBar tích hợp (Search & Filter Bar) cho ScoreKeeper.
 * Thiết kế gom cụm ô tìm kiếm, nút clear và nút lọc vào một thanh thống nhất.
 */
export function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Tìm kiếm...',
  isFilterOpen = false,
  onFilterToggle,
  hasFilters = false,
  className,
}) {
  const hasValue = Boolean(value !== undefined && value !== null && String(value).trim() !== '')

  return (
    <div className={clsx('custom-search-bar', className)}>
      {/* Icon kính lúp tìm kiếm ở bên trái */}
      <div className="custom-search-icon-left">
        <Icon src="/search.png" color="var(--color-gray-40)" size={24} />
      </div>

      {/* Ô nhập liệu tìm kiếm */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="custom-search-input"
        aria-label={placeholder}
      />

      {/* Nút Xóa nhanh dữ liệu (Clear Button) */}
      {onClear && hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="custom-search-clear-btn"
          aria-label="Xóa nội dung tìm kiếm"
        >
          <Icon src="/cancel.png" color="var(--color-gray-40)" size={24} />
        </button>
      )}


      {/* Đường divider kẻ dọc phân chia mảnh */}
      <span className="custom-search-divider" aria-hidden="true" />

      {/* Nút phễu lọc bên phải */}
      <button
        type="button"
        className={clsx(
          'custom-search-filter-btn',
          (isFilterOpen || hasFilters) && 'active'
        )}
        onClick={onFilterToggle}
        aria-label="Bộ lọc"
      >
        <Icon
          src={isFilterOpen ? "/filter-filled.png" : "/filter-icon.svg"}
          color={isFilterOpen || hasFilters ? "var(--color-brand-600)" : "var(--color-gray-80)"}
          size={24}
        />
      </button>
    </div>
  )
}
