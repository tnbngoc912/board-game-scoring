import React from 'react'
import { motion } from 'framer-motion'
import { getOptimizedImageUrl } from '../utils/imagePreloader'

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
  const imageSrc = getOptimizedImageUrl(thumbnailUrl, 160)

  return (
    <MotionComponent className={`game-card ${className}`.trim()} {...props}>
      <div
        className={`game-card-thumb ${thumbClassName}`.trim()}
        style={{ background }}
        aria-hidden="true"
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            width={80}
            height={80}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
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
