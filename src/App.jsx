import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'
import { SetupScreen } from './components/SetupScreen'
import { GameScreen } from './components/GameScreen'
import { GameOverviewScreen } from './components/GameOverviewScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { LoginScreen } from './components/LoginScreen'
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen'
import { Toast } from './components/Toast'
import { useToast } from './hooks/useToast'
import { LoadingOverlay } from "./components/LoadingOverlay"

export default function App() {
  const [homeResetToken, setHomeResetToken] = useState(0)
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { darkMode, boardGameId, gameFlow, setGameFlow, clearPlayers } = useGameStore()
  const { token, user, isAuthLoading, bootstrap, login, forgotPassword, logout, refreshProfile } = useAuthStore()
  const { message, visible, show: showToast } = useToast()
  const screen = pathname === '/game' ? 'game' : pathname.startsWith('/history') ? 'history' : 'setup'
  const isForgotPasswordRoute = pathname === '/forgot-password'
  const isHistoryDetailRoute = /^\/history\/[^/]+$/.test(pathname)

  useEffect(() => {
    document.documentElement.className = darkMode ? '' : 'theme-light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#8c613b' : '#f5eedf')
  }, [darkMode])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (!token || !user) return
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0 })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      document.querySelectorAll('.screen').forEach((node) => {
        node.scrollTop = 0
        node.scrollLeft = 0
      })
    })
  }, [screen])

  useEffect(() => {
    if (!token || !user) return
    refreshProfile().catch(() => {
      // Bỏ qua lỗi ngầm nếu có sự cố mạng
    })
  }, [screen, pathname, gameFlow, token, user, refreshProfile])

  useEffect(() => {
    if (screen !== 'game') return
    if (boardGameId) return
    router.replace('/')
  }, [screen, boardGameId, router])

  function showHome() {
    clearPlayers()
    router.push('/')
    setHomeResetToken((value) => value + 1)
  }

  async function handleLogin(email, password) {
    try {
      setIsLoginSubmitting(true)
      await login(email, password)
      showToast('Đăng nhập thành công')
      if (pathname.startsWith('/history') || pathname === '/game') return
      router.replace('/')
    } catch (error) {
      showToast(error?.message || 'Đăng nhập thất bại')
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  async function handleForgotPassword(email) {
    if (!email) {
      showToast('Vui lòng nhập email')
      return
    }

    try {
      setIsLoginSubmitting(true)
      await forgotPassword(email)
      showToast('Mật khẩu mới đã được gửi vào email của bạn')
    } catch (error) {
      showToast(error?.message || 'Không thể gửi mật khẩu mới')
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  const screenProps = {
    toast: showToast,
    onShowSetup: showHome,
    onShowHistory: () => router.push('/history'),
    onNewGame: showHome,
  }

  if (isAuthLoading) {
    return (
      <LoadingOverlay label="Đang tải..." />

    )
  }

  if (!token || !user) {
    return (
      <div className="app-shell screen-setup">
        {isForgotPasswordRoute ? (
          <ForgotPasswordScreen
            onSubmit={handleForgotPassword}
            onBack={() => router.push('/')}
            isSubmitting={isLoginSubmitting}
          />
        ) : (
          <LoginScreen
            onLogin={handleLogin}
            onGoForgotPassword={() => router.push('/forgot-password')}
            isSubmitting={isLoginSubmitting}
          />
        )}
        <Toast message={message} visible={visible} />
      </div>
    )
  }

  return (
    <div className={`app-shell screen-${screen}`}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {screen === 'game' && !boardGameId ? (
          <div className="screen loading-shell" aria-busy="true">
            <div className="screen-inner">Đang chuyển hướng...</div>
          </div>
        ) : null}
        {screen === 'setup' ? (
          <SetupScreen
            onStart={() => router.push('/game')}
            onChooseGame={() => router.push('/game')}
            homeResetToken={homeResetToken}
            {...screenProps}
          />
        ) : null}
        {screen === 'game' && boardGameId ? (
          gameFlow === 'overview' ? (
            <GameOverviewScreen
              boardGameId={boardGameId}
              toast={showToast}
              onBack={showHome}
              onCreateScore={() => setGameFlow('setup')}
            />
          ) : gameFlow === 'setup' ? (
            <SetupScreen
              onStart={() => setGameFlow('entry')}
              initialStep="config"
              onBackFromConfig={() => setGameFlow('overview')}
              homeResetToken={homeResetToken}
              {...screenProps}
            />
          ) : (
            <GameScreen {...screenProps} />
          )
        ) : null}
        {screen === 'history' ? <HistoryScreen {...screenProps} /> : null}
      </div>

      {screen !== 'game' && !isHistoryDetailRoute ? (
        <nav className="bottom-nav" aria-label="Dieu huong chinh">
          <Link
            href="/"
            className={`bottom-nav-item${screen === 'setup' ? ' active' : ''}`}
            aria-current={screen === 'setup' ? 'page' : undefined}
            onClick={() => {
              if (screen === 'setup') {
                setHomeResetToken((value) => value + 1)
              }
            }}
          >
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5z" /></svg>
            </span>
            Trang chủ
          </Link>
          <Link
            href="/history"
            className={`bottom-nav-item${screen === 'history' ? ' active' : ''}`}
            aria-current={screen === 'history' ? 'page' : undefined}
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
      ) : null}

      <Toast message={message} visible={visible} />
    </div>
  )
}
