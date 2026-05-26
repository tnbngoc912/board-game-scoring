'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollToTopOnRouteChange() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    const reset = () => {
      const activeScreen = document.querySelector('.app-shell .screen')
      if (activeScreen instanceof HTMLElement) {
        activeScreen.scrollTop = 0
        activeScreen.scrollLeft = 0
      } else {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
    }

    reset()
    const rafId = window.requestAnimationFrame(reset)
    return () => window.cancelAnimationFrame(rafId)
  }, [pathname])

  return null
}
