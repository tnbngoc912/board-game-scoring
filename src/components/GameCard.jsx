import React from 'react'
import { motion } from 'framer-motion'

export function GameCard({
  as = 'button',
  title,
  thumbnailUrl,
  fallbackText = 'BG',
  background,
  className = '',
  thumbClassName = '',
  contentClassName = '',
  children,
  ...props
}) {
  const MotionComponent = as === 'article' ? 'article' : 'button'

  return (
    <MotionComponent className={`game-card ${className}`.trim()} {...props}>
      <div
        className={`game-card-thumb ${thumbClassName}`.trim()}
        style={{ background }}
        aria-hidden="true"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            width={80}
            height={80}
            loading="eager"
            decoding="sync"
            className="game-card-img"
          />
        ) : (
          <span>{fallbackText}</span>
        )}
      </div>
      <div className={`game-card-info ${contentClassName}`.trim()}>
        <h2>{title}</h2>
        {children}
      </div>
    </MotionComponent>
  )
}
