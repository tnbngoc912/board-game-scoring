import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '../../store/authStore'
import { LoadingState } from '../ui/LoadingState'

export function ProtectedScreen({ children }) {
  const router = useRouter()
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
    if (!token || !user) router.replace('/login')
  }, [isAuthLoading, token, user, router])

  if (isAuthLoading) return <LoadingState label="Đang tải..." />
  if (!token || !user) return <LoadingState label="Đang chuyển hướng..." />

  return children
}
