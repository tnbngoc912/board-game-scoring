'use client'

import React, { useState, useEffect } from 'react'

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    try {
      const hasShown = sessionStorage.getItem('bg_splash_shown')
      if (!hasShown) {
        setIsVisible(true)
        sessionStorage.setItem('bg_splash_shown', 'true')

        const timer = setTimeout(() => {
          setIsExiting(true)
          const exitTimer = setTimeout(() => {
            setIsVisible(false)
          }, 350)

          return () => clearTimeout(exitTimer)
        }, 1000)

        return () => clearTimeout(timer)
      }
    } catch (err) {
      // Bỏ qua lỗi nếu trình duyệt chặn sessionStorage
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={`splash-screen-container ${isExiting ? 'splash-screen-exit' : ''}`}
      aria-hidden="true"
    >
      <div className="splash-screen-content">
        <img
          src="/icon-512x512.png"
          alt="BG Score Logo"
          className="splash-screen-logo"
          width={110}
          height={110}
        />
      </div>
    </div>
  )
}
