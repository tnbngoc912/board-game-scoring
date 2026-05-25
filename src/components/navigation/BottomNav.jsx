import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'

export function BottomNav({ onHomeReselect }) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  const activeKey = useMemo(() => {
    if (pathname.startsWith('/history')) return 'history'
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
          <svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5z" /></svg>
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
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 3.5" /></svg>
        </span>
        Lịch sử
      </Link>

      <button
        className="bottom-nav-item"
        type="button"
        onClick={() => {
          logout()
          router.replace('/')
        }}
      >
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
        </span>
        Đăng xuất
      </button>
    </nav>
  )
}
