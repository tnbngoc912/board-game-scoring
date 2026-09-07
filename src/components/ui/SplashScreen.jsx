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

        // Kích hoạt class và đổi theme-color sang #93653f cho vùng safe-area trên iPhone
        document.documentElement.classList.add('is-splash-active')
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', '#93653f')
        }

        const timer = setTimeout(() => {
          setIsExiting(true)

          // Trả lại theme-color mặc định cho giao diện app chính
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#f5eedf')
          }

          const exitTimer = setTimeout(() => {
            setIsVisible(false)
            document.documentElement.classList.remove('is-splash-active')
          }, 350)

          return () => clearTimeout(exitTimer)
        }, 1000)

        return () => {
          clearTimeout(timer)
          document.documentElement.classList.remove('is-splash-active')
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#f5eedf')
          }
        }
      } else {
        // Đã hiển thị trước đó trong phiên, dọn dẹp trạng thái nếu có
        document.documentElement.classList.remove('is-splash-active')
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', '#f5eedf')
        }
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
