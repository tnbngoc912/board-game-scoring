import React from 'react'
import { ArrowLeft, X } from 'lucide-react'

export function Header({ onBack, onClose, isCloseDisabled = false, title = 'BGSCORE' }) {
  return (
    <header className="overview-header" aria-label="BGScore">
      <div className="overview-topbar">
        {onBack ? (
          <button className="overview-back-btn" onClick={onBack} aria-label="Quay lại">
            <ArrowLeft size={16} strokeWidth={3} />
          </button>
        ) : (
          <div className="score-entry-spacer" aria-hidden="true" />
        )}

        <div className="home-logo">{title}</div>

        {onClose ? (
          <button 
            className="score-close-btn" 
            onClick={onClose} 
            aria-label="Đóng"
            disabled={isCloseDisabled}
          >
            <X size={16} strokeWidth={3} />
          </button>
        ) : (
          <div className="score-entry-spacer" aria-hidden="true" />
        )}
      </div>
    </header>
  )
}
