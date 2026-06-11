import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Icon } from '../ui/Icon'

export function BottomNav({ onHomeReselect }) {
  const pathname = usePathname()

  const activeKey = useMemo(() => {
    if (pathname.startsWith('/history')) return 'history'
    if (pathname.startsWith('/achievements')) return 'achievements'
    if (pathname.startsWith('/account')) return 'account'
    return 'home'
  }, [pathname])

  const navItems = [
    {
      key: 'home',
      href: '/',
      label: 'Trang chủ',
      iconSrc: '/home.png',
      activeIconSrc: '/home-filled.png',
      onClick: () => {
        if (activeKey === 'home' && onHomeReselect) onHomeReselect()
      }
    },
    {
      key: 'history',
      href: '/history',
      label: 'Lịch sử',
      iconSrc: '/history.png',
      activeIconSrc: '/history-filled.png',
    },
    {
      key: 'achievements',
      href: '/achievements',
      label: 'Thành tựu',
      iconSrc: '/trophy-cup.png',
      activeIconSrc: '/trophy-cup-filled.png',
    },
    {
      key: 'account',
      href: '/account',
      label: 'Tài khoản',
      iconSrc: '/person-user.png',
      activeIconSrc: '/person-user-filled.png',
    }
  ]

  return (
    <nav className="bottom-nav" aria-label="Dieu huong chinh">
      {navItems.map((item) => {
        const isActive = activeKey === item.key
        const currentIconSrc = isActive ? item.activeIconSrc : item.iconSrc
        return (
          <Link
            key={item.key}
            href={item.href}
            prefetch
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={item.onClick}
            style={{ position: 'relative' }}
          >
            {isActive && (
              <motion.div
                layoutId="bottom-nav-active-indicator"
                className="bottom-nav-active-indicator"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span aria-hidden="true" style={{ position: 'relative', zIndex: 1 }}>
              <Icon src={currentIconSrc} size={24} color="currentColor" />
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

