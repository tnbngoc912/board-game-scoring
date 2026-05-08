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
  const MotionComponent = as === 'article' ? motion.article : motion.button

  return (
    <MotionComponent className={`game-card ${className}`.trim()} {...props}>
      <div
        className={`game-card-thumb ${thumbClassName}`.trim()}
        style={{ background }}
        aria-hidden="true"
      >
        {thumbnailUrl ? (
          <img loading="lazy" alt="" width={80} height={80} src={thumbnailUrl} />
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
