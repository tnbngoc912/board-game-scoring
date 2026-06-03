import React, { useState } from 'react'
import { Icon } from './Icon'
import './PasswordInput.css'

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="password-input-container">
      <span className="password-input-icon-left" aria-hidden="true">
        <Icon src="/lock.png" size={24} color="#38322E" />
      </span>
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        className="password-input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-input-toggle-btn"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {showPassword ? (
          <Icon src="/eye-show.png" size={24} color="#38322E" />
        ) : (
          <Icon src="/eye-hide.png" size={24} color="#38322E" />
        )}
      </button>
    </div>
  )
}
