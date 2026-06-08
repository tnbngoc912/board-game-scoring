import React from 'react'
import Image from "next/image"

function HeaderBrand({ title }) {
  if (title) {
    return <div className="title-header" title={title}>{title}</div>
  }

  return <Image src="/logo.svg" className="logo-header" alt="BGScore" width={103} height={17} />
}

export function Header({ onBack, onClose, isCloseDisabled = false, title, rightElement }) {
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

        <HeaderBrand title={title} />

        {rightElement ? (
          rightElement
        ) : onClose ? (
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
