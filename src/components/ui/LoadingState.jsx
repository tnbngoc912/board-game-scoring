import React from 'react'
import { LoadingOverlay } from '../LoadingOverlay'

export function LoadingState({ label = 'Đang tải...' }) {
  return (
    <div className="screen loading-shell" aria-busy="true">
      <LoadingOverlay label={label} />
    </div>
  )
}
