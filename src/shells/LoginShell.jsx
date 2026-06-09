'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '../store/authStore'
import { LoginScreen } from '../components/LoginScreen'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { LoadingState } from '../components/ui/LoadingState'

export function LoginShell() {
  const router = useRouter()
  const [redirectUrl, setRedirectUrl] = useState(null)
  const { message, visible, show: showToast } = useToast()
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false)

  const { token, user, isAuthLoading, bootstrap, login } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
      user: state.user,
      isAuthLoading: state.isAuthLoading,
      bootstrap: state.bootstrap,
      login: state.login,
    }))
  )

  useEffect(() => {
    bootstrap()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      if (redirect) {
        setRedirectUrl(redirect)
      }
    }
  }, [bootstrap])

  useEffect(() => {
    if (isAuthLoading) return
    if (token && user) {
      if (redirectUrl) {
        router.replace(decodeURIComponent(redirectUrl))
      } else {
        router.replace('/')
      }
    }
  }, [isAuthLoading, token, user, router, redirectUrl])

  async function handleLogin(email, password) {
    try {
      setIsLoginSubmitting(true)
      await login(email, password)
      showToast('Đăng nhập thành công')
      if (redirectUrl) {
        router.replace(decodeURIComponent(redirectUrl))
      } else {
        router.replace('/')
      }
    } catch (error) {
      showToast(error?.message || 'Đăng nhập thất bại')
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  if (isAuthLoading) {
    return <LoadingState label="Đang tải..." />
  }

  if (token && user) {
    return <LoadingState label="Đang chuyển hướng..." />
  }

  return (
    <div className="app-shell screen-setup">
      <LoginScreen
        onLogin={handleLogin}
        onGoForgotPassword={() => router.push('/forgot-password')}
        isSubmitting={isLoginSubmitting}
      />
      <Toast message={message} visible={visible} />
    </div>
  )
}
