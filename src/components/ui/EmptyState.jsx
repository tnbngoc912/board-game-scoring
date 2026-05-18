import React from 'react'

export function EmptyState({ title, description, action }) {
  return (
    <div className="paper-card empty-state">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action || null}
    </div>
  )
}
