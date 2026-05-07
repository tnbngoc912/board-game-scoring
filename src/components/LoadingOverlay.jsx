import React from 'react'

export function LoadingOverlay({ label = 'Đang tải...', inline = false }) {
  return (
    <div
      className={`loading-overlay${inline ? ' inline' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="loading-overlay-spinner" aria-hidden="true" />
      <div className="loading-overlay-text">{label}</div>
    </div>
  )
}
