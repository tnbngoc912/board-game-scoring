import React from 'react'
import { ArrowLeft, X } from 'lucide-react'
import Image from "next/image"

export function Header({ onBack, onClose, isCloseDisabled = false, title = 'BGSCORE' }) {
  return (
    <header className="overview-header" aria-label="BGScore">
      <div className="overview-topbar">
        {onBack ? (
          <button className="overview-back-btn" onClick={onBack} aria-label="Quay lại">
            <Image src="/back-icon.svg" alt="Back" width={32} height={32} />
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
            <Image src="/close-icon.svg" alt='' width={32} height={32} />
          </button>
        ) : (
          <div className="score-entry-spacer" aria-hidden="true" />
        )}
      </div>
    </header>
  )
}
