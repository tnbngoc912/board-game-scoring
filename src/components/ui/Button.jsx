import React from 'react'
import clsx from 'clsx'

/**
 * Component Button tái sử dụng dùng chung cho hệ thống BoardGameScoring.
 * Hỗ trợ 4 variants: 'primary', 'secondary', 'outline', 'ghost'
 * Hỗ trợ 3 sizes: 'sm', 'md', 'lg'
 * Hỗ trợ icon bên trái (leftIcon) và bên phải (rightIcon)
 */
export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        'btn-custom',
        `variant-${variant}`,
        `size-${size}`,
        className
      )}
      {...props}
    >
      {leftIcon && <span className="btn-icon btn-icon-left">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="btn-icon btn-icon-right">{rightIcon}</span>}
    </button>
  )
}
