'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollToTopOnRouteChange() {
  const pathname = usePathname()

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0

      document.querySelectorAll('.screen').forEach((node) => {
        node.scrollTop = 0
        node.scrollLeft = 0
      })
    })
  }, [pathname])

  return null
}
