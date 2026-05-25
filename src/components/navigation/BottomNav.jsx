import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Trophy, UserCircle } from 'lucide-react'

export function BottomNav({ onHomeReselect }) {
  const pathname = usePathname()

  const activeKey = useMemo(() => {
    if (pathname.startsWith('/history')) return 'history'
    if (pathname.startsWith('/achievements')) return 'achievements'
    if (pathname.startsWith('/account')) return 'account'
    return 'home'
  }, [pathname])

  return (
    <nav className="bottom-nav" aria-label="Dieu huong chinh">
      <Link
        href="/"
        prefetch
        className={`bottom-nav-item${activeKey === 'home' ? ' active' : ''}`}
        aria-current={activeKey === 'home' ? 'page' : undefined}
        onClick={() => {
          if (activeKey === 'home' && onHomeReselect) onHomeReselect()
        }}
      >
        <span aria-hidden="true">
          <Home />
        </span>
        Trang chủ
      </Link>

      <Link
        href="/history"
        prefetch
        className={`bottom-nav-item${activeKey === 'history' ? ' active' : ''}`}
        aria-current={activeKey === 'history' ? 'page' : undefined}
      >
        <span aria-hidden="true">
          <Clock />
        </span>
        Lịch sử
      </Link>

      <Link
        href="/achievements"
        prefetch
        className={`bottom-nav-item${activeKey === 'achievements' ? ' active' : ''}`}
        aria-current={activeKey === 'achievements' ? 'page' : undefined}
      >
        <span aria-hidden="true">
          <Trophy />
        </span>
        Thành tựu
      </Link>

      <Link
        href="/account"
        prefetch
        className={`bottom-nav-item${activeKey === 'account' ? ' active' : ''}`}
        aria-current={activeKey === 'account' ? 'page' : undefined}
      >
        <span aria-hidden="true">
          <UserCircle />
        </span>
        Tài khoản
      </Link>
    </nav>
  )
}
