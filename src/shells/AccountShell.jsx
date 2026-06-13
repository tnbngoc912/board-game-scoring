import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '../store/authStore'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { BottomNav } from '../components/navigation/BottomNav'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import { Header } from '../components/Header'
import { PullToRefresh } from '../components/ui/PullToRefresh'
import { Icon } from '../components/ui/Icon'
import { disableFcmNotifications, enableFcmNotifications, hasEnabledFcmNotifications } from '../api/firebaseNotifications'

export function AccountShell() {
  const router = useRouter()
  const { user, logout, changePassword, refreshProfile } = useAuthStore()
  const { message, visible, show: showToast } = useToast()
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [isUpdatingPush, setIsUpdatingPush] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.navigator.standalone || 
                         window.matchMedia('(display-mode: standalone)').matches ||
                         new URLSearchParams(window.location.search).get('test-pwa') === 'true'
      setIsStandalone(standalone)
    }
  }, [])

  useEffect(() => {
    setIsPushEnabled(hasEnabledFcmNotifications())
  }, [])

  function handleLogout() {
    logout()
    router.replace('/')
  }

  async function handleTogglePush() {
    if (isUpdatingPush) return

    setIsUpdatingPush(true)
    try {
      if (isPushEnabled) {
        await disableFcmNotifications()
        setIsPushEnabled(false)
        showToast('Đã tắt thông báo')
      } else {
        await enableFcmNotifications()
        setIsPushEnabled(true)
        showToast('Đã bật thông báo')
      }
    } catch (error) {
      showToast(error?.message || 'Không cập nhật được thông báo')
    } finally {
      setIsUpdatingPush(false)
    }
  }

  return (
    <ProtectedScreen>
      <div className="app-shell screen-account">
        <div className={`account-screen${isStandalone ? ' has-ptr' : ''}`}>
          <Header />

          <PullToRefresh onRefresh={async () => {
            try {
              await refreshProfile()
              showToast('Đã làm mới thông tin tài khoản')
            } catch (err) {
              showToast('Không thể làm mới dữ liệu')
            }
          }}>
            <div className="account-content">
            {user && (
              <>
                <div className="account-profile-card">
                  <div className="account-avatar-wrapper">
                    {user.avatar_url ? (
                      <Image 
                        src={user.avatar_url} 
                        alt="" 
                        className="account-avatar-image" 
                        width={64}
                        height={64}
                        priority
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="account-avatar-icon">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <div className="account-user-info">
                    <div className="account-user-name">{user?.name || 'Người dùng ScoreKeeper'}</div>
                    <div className="account-user-badge">{user?.role || 'Thành viên'}</div>
                  </div>
                </div>

                <div className="account-email-section">
                  <div className="account-email-label">EMAIL</div>
                  <div className="account-email-box">
                    <Icon src="/email.png" size={24} color="#38322E" />
                    <span>{user?.email}</span>
                  </div>
                </div>
              </>
            )}

            <div className="account-actions">
              <button 
                className="btn-account-action btn-account-action-with-meta" 
                type="button"
                onClick={handleTogglePush}
                disabled={isUpdatingPush}
              >
                <Icon src="/send-icon.svg" size={24} color="#38322E" />
                <span>
                  <strong>{isUpdatingPush ? 'Đang cập nhật...' : isPushEnabled ? 'Tắt thông báo' : 'Bật thông báo'}</strong>
                  <small>{isPushEnabled ? 'Bạn đang nhận thông báo bình luận mới' : 'Nhận thông báo khi có bình luận mới trong trận của bạn'}</small>
                </span>
              </button>

              <button 
                className="btn-account-action" 
                type="button"
                onClick={() => router.push('/change-password')}
              >
                <Icon src="/change-pass.png" size={24} color="#38322E" />
                Đổi mật khẩu
              </button>

              <button 
                className="btn-account-action" 
                type="button" 
                onClick={handleLogout}
              >
                <Icon src="/logout.png" size={24} color="#38322E" />
                Đăng xuất
              </button>
            </div>

            <div className="account-footer">
              <div className="account-footer-brand">BGSCORE</div>
              <div className="account-footer-version">Version 1.0.0 (Build 100)</div>
            </div>
          </div>
          </PullToRefresh>
        </div>

        <BottomNav />
        <Toast message={message} visible={visible} />
      </div>
    </ProtectedScreen>
  )
}
