import React from 'react'

export function ErrorState({ message = 'Đã xảy ra lỗi.', action }) {
  return (
    <div className="paper-card empty-state">
      <p>{message}</p>
      {action || null}
    </div>
  )
}
