import React from 'react'
import clsx from 'clsx'

/**
 * Component SwitchTabs tái sử dụng (Segmented Control).
 * Có hiệu ứng sliding pill indicator chạy trơn tru qua lại bằng CSS Transform.
 * Không bị lỗi layout shift khi form bên dưới thay đổi kích thước.
 *
 * @param {Array<{ value: string, label: React.ReactNode, icon?: React.ReactNode }>} options Danh sách các tab
 * @param {string} value Giá trị tab đang chọn
 * @param {(val: string) => void} onChange Callback khi đổi tab
 * @param {string} className Class tùy biến thêm
 * @param {string} ariaLabel Nhãn accessibility cho tablist
 */
export function SwitchTabs({
  options = [],
  value,
  onChange,
  className,
  ariaLabel = 'Chuyển đổi chế độ',
}) {
  const activeIndex = Math.max(0, options.findIndex((opt) => opt.value === value))
  const count = Math.max(1, options.length)

  return (
    <div
      className={clsx('switch-tabs-container', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      <span
        className="switch-tab-pill-track"
        style={{
          width: `calc((100% - 8px) / ${count})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
        aria-hidden="true"
      />

      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={clsx('switch-tab-btn', isActive && 'active')}
            onClick={() => {
              if (onChange && !isActive) {
                onChange(option.value)
              }
            }}
          >
            <span className="switch-tab-content">
              {option.icon && <span className="switch-tab-icon">{option.icon}</span>}
              <span className="switch-tab-label">{option.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
