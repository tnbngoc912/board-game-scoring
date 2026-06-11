import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '../../store/authStore'
import { LoadingState } from '../ui/LoadingState'

export function ProtectedScreen({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { token, user, isAuthLoading, bootstrap } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
      user: state.user,
      isAuthLoading: state.isAuthLoading,
      bootstrap: state.bootstrap,
    }))
  )

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (isAuthLoading) return
    if (!token || !user) {
      let currentPath = pathname
      if (typeof window !== 'undefined') {
        const query = window.location.search
        if (query) {
          currentPath += query
        }
      }
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [isAuthLoading, token, user, router, pathname])

  if (isAuthLoading) return <LoadingState label="Đang tải..." />
  if (!token || !user) return <LoadingState label="Đang chuyển hướng..." />

  return children
}
