import React, { forwardRef } from 'react'
import clsx from 'clsx'

/**
 * Component Input tái sử dụng cho hệ thống ScoreKeeper.
 * Hỗ trợ leftIcon, rightIcon và nút clear (X) xóa dữ liệu nhanh.
 * Hỗ trợ forwardRef để tương thích tốt với Next.js và React Forms.
 */
export const Input = forwardRef(({
  className,
  wrapperClassName,
  leftIcon,
  rightIcon,
  onClear,
  value = '',
  disabled = false,
  type = 'text',
  ...props
}, ref) => {
  const hasValue = Boolean(value !== undefined && value !== null && String(value).trim() !== '')
  const showClear = onClear && !disabled && hasValue

  return (
    <div className={clsx(
      'custom-input-wrapper',
      disabled && 'disabled',
      wrapperClassName
    )}>
      {leftIcon && <span className="custom-input-icon custom-input-icon-left">{leftIcon}</span>}
      
      <input
        ref={ref}
        type={type}
        value={value}
        disabled={disabled}
        className={clsx('custom-input-control', className)}
        {...props}
      />

      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className="custom-input-clear-btn"
          aria-label="Xóa nội dung"
        >
          ✕
        </button>
      )}

      {rightIcon && <span className="custom-input-icon custom-input-icon-right">{rightIcon}</span>}
    </div>
  )

})

Input.displayName = 'Input'
