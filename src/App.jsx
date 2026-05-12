import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'
import { SetupScreen } from './components/SetupScreen'
import { GameScreen } from './components/GameScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { AchievementScreen } from './components/AchievementScreen'
import { AccountScreen } from './components/AccountScreen'
import { LoginScreen } from './components/LoginScreen'
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen'
import { Toast } from './components/Toast'
import { useToast } from './hooks/useToast'

export default function App() {
  const [homeResetToken, setHomeResetToken] = useState(0)
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { darkMode } = useGameStore()
  const { token, user, isAuthLoading, bootstrap, login, forgotPassword, logout } = useAuthStore()
  const { message, visible, show: showToast } = useToast()
  const screen = pathname === '/game'
    ? 'game'
    : pathname.startsWith('/history')
      ? 'history'
      : pathname.startsWith('/achievements')
        ? 'achievements'
        : pathname.startsWith('/account')
          ? 'account'
          : 'setup'
  const isForgotPasswordRoute = pathname === '/forgot-password'

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

  function showHome() {
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
    onShowAchievements: () => router.push('/achievements'),
    onShowAccount: () => router.push('/account'),
    onNewGame: showHome,
  }

  if (isAuthLoading) {
    return (
      <div className="app-shell screen-setup">
        <div className="screen">
          <div className="screen-inner">Đang tải...</div>
        </div>
      </div>
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
        {screen === 'setup' ? <SetupScreen onStart={() => router.push('/game')} homeResetToken={homeResetToken} {...screenProps} /> : null}
        {screen === 'game' ? <GameScreen {...screenProps} /> : null}
        {screen === 'history' ? <HistoryScreen {...screenProps} /> : null}
        {screen === 'achievements' ? <AchievementScreen /> : null}
        {screen === 'account' ? (
          <AccountScreen
            user={user}
            onLogout={() => {
              logout()
              router.replace('/')
            }}
          />
        ) : null}
      </div>

      {screen !== 'game' ? (
        <nav
          className="bottom-nav"
          aria-label="Dieu huong chinh"
          style={{
            '--bottom-nav-active': screen === 'history'
              ? '25%'
              : screen === 'achievements'
                ? '50%'
                : screen === 'account'
                  ? '75%'
                  : '0%',
          }}
        >
          <button
            className={`bottom-nav-item${screen === 'setup' ? ' active' : ''}`}
            onClick={showHome}
          >
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5z" /></svg>
            </span>
            Trang chủ          </button>
          <button
            className={`bottom-nav-item${screen === 'history' ? ' active' : ''}`}
            onClick={() => router.push('/history')}
          >
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 3.5" /></svg>
            </span>
            Lịch sử
          </button>
          <button
            className={`bottom-nav-item${screen === 'achievements' ? ' active' : ''}`}
            onClick={() => router.push('/achievements')}
          >
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m7 14 3 3 7-7" /><path d="M5 4h14v16H5z" /></svg>
            </span>
            Thành tựu
          </button>
          <button
            className={`bottom-nav-item${screen === 'account' ? ' active' : ''}`}
            onClick={() => router.push('/account')}
          >
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>
            </span>
            Tài khoản
          </button>
        </nav>
      ) : null}

      <Toast message={message} visible={visible} />
    </div>
  )
}
