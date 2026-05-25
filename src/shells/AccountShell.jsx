import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Mail, User, LockKeyhole, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { BottomNav } from '../components/navigation/BottomNav'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import { Header } from '../components/Header'

export function AccountShell() {
  const router = useRouter()
  const { user, logout, changePassword } = useAuthStore()
  const { message, visible, show: showToast } = useToast()


  function handleLogout() {
    logout()
    router.replace('/')
  }

  return (
    <ProtectedScreen>
      <div className="app-shell screen-account">
        <div className="account-screen">
          <Header />

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
                    <Mail size={20} strokeWidth={1.7} />
                    <span>{user?.email}</span>
                  </div>
                </div>
              </>
            )}

            <div className="account-actions">
              <button 
                className="btn-account-action" 
                type="button"
                onClick={() => router.push('/change-password')}
              >
                <LockKeyhole size={20} strokeWidth={1.8} />
                Đổi mật khẩu
              </button>

              <button 
                className="btn-account-action" 
                type="button" 
                onClick={handleLogout}
              >
                <LogOut size={20} strokeWidth={1.8} />
                Đăng xuất
              </button>
            </div>

            <div className="account-footer">
              <div className="account-footer-brand">BGSCORE</div>
              <div className="account-footer-version">Version 1.0.0 (Build 100)</div>
            </div>
          </div>
        </div>

        <BottomNav />
        <Toast message={message} visible={visible} />
      </div>
    </ProtectedScreen>
  )
}
