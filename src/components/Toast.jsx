import React from 'react'

export function Toast({ message, visible }) {
  return (
    <div
      className={`toast${visible ? ' show' : ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  )
}
