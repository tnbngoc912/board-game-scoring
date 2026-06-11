import React from 'react'

export function Icon({
  src,
  color = 'currentColor',
  size = 24,
  className = '',
  style = {},
  ...props
}) {
  if (!src) return null

  const maskStyles = {
    width: size,
    height: size,
    backgroundColor: color,
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    display: 'inline-block',
    flexShrink: 0,
    ...style,
  }

  return (
    <div
      className={`custom-icon ${className}`}
      style={maskStyles}
      {...props}
    />
  )
}
