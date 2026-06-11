'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollRestorer() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    // Reset scroll khi chuyển trang (route thay đổi)
    const resetScroll = () => {
      window.scroll(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      document.querySelectorAll('.screen').forEach((node) => {
        node.scrollTop = 0
        node.scrollLeft = 0
      })
    }

    resetScroll()

    // Sử dụng MutationObserver để lắng nghe sự thay đổi của các view lớn
    const observer = new MutationObserver(resetScroll)
    const shellObserver = new MutationObserver(resetScroll)

    // Quan sát container trực tiếp chứa các màn hình
    const mainContainer = document.querySelector('.app-shell > div')
    if (mainContainer) {
      observer.observe(mainContainer, { childList: true })
    }

    // Quan sát app-shell chính để bắt các thay đổi cấu trúc lớn
    const appShell = document.querySelector('.app-shell')
    if (appShell) {
      shellObserver.observe(appShell, { childList: true })
    }

    return () => {
      observer.disconnect()
      shellObserver.disconnect()
    }
  }, [pathname])

  return null
}
