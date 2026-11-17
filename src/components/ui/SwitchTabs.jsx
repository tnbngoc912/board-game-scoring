import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Component SwitchTabs tái sử dụng (Segmented Control).
 * Có hiệu ứng sliding pill indicator chạy trơn tru qua lại bằng framer-motion.
 *
 * @param {Array<{ value: string, label: React.ReactNode, icon?: React.ReactNode }>} options Danh sách các tab
 * @param {string} value Giá trị tab đang chọn
 * @param {(val: string) => void} onChange Callback khi đổi tab
 * @param {string} layoutId Định danh layoutId cho Framer Motion (cần unique nếu có nhiều SwitchTabs)
 * @param {string} className Class tùy biến thêm
 * @param {string} ariaLabel Nhãn accessibility cho tablist
 */
export function SwitchTabs({
  options = [],
  value,
  onChange,
  layoutId = 'switch-tabs-indicator',
  className,
  ariaLabel = 'Chuyển đổi chế độ',
}) {
  return (
    <div
      className={clsx('switch-tabs-container', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
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
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="switch-tab-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
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
