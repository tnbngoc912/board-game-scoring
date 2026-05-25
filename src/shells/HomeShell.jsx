'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { useGameSessionStore } from '../store/gameSessionStore'
import { SetupScreen } from '../components/SetupScreen'
import { LoginScreen } from '../components/LoginScreen'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { LoadingState } from '../components/ui/LoadingState'
import { BottomNav } from '../components/navigation/BottomNav'

export function HomeShell() {
  const router = useRouter()
  const { message, visible, show: showToast } = useToast()
  const [homeResetToken, setHomeResetToken] = useState(0)
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

  const clearPlayers = useGameStore((state) => state.clearPlayers)
  const startGameFlow = useGameSessionStore((state) => state.startGameFlow)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  async function handleLogin(email, password) {
    try {
      setIsLoginSubmitting(true)
      await login(email, password)
      showToast('Đăng nhập thành công')
    } catch (error) {
      showToast(error?.message || 'Đăng nhập thất bại')
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  function showHome() {
    clearPlayers()
    setHomeResetToken((value) => value + 1)
  }

  if (isAuthLoading) {
    return <LoadingState label="Đang tải..." />
  }

  if (!token || !user) {
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

  return (
    <div className="app-shell screen-setup">
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <SetupScreen
          onStart={() => router.push('/game')}
          onChooseGame={(game) => {
            startGameFlow(game)
            router.push('/game')
          }}
          homeResetToken={homeResetToken}
          toast={showToast}
          onShowSetup={showHome}
          onShowHistory={() => router.push('/history')}
          onNewGame={showHome}
        />
      </div>
      <BottomNav onHomeReselect={() => setHomeResetToken((value) => value + 1)} />
      <Toast message={message} visible={visible} />
    </div>
  )
}
