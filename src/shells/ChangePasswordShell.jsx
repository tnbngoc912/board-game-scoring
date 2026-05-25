import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import { Header } from '../components/Header'

export function ChangePasswordShell() {
  const router = useRouter()
  const { changePassword } = useAuthStore()
  const { message, visible, show: showToast } = useToast()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Trạng thái ẩn/hiện mật khẩu cho từng ô nhập liệu
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu mới không trùng khớp')
      return
    }

    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải từ 6 ký tự trở lên')
      return
    }

    try {
      setIsSubmitting(true)
      await changePassword(oldPassword, newPassword)
      showToast('Đổi mật khẩu thành công')
      
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Chờ toast hiển thị rồi quay về trang tài khoản
      setTimeout(() => {
        router.push('/account')
      }, 1500)
    } catch (error) {
      showToast(error?.message || 'Mật khẩu cũ không chính xác')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedScreen>
      <div className="app-shell change-password-screen">
        <Header onBack={() => router.push('/account')} />

        <main className="change-password-content">
          <h1 className="change-password-title">Đổi mật khẩu</h1>

          <form onSubmit={handleSubmit} className="change-password-form">
            {/* Mật khẩu cũ */}
            <div className="change-password-input-wrapper">
              <span className="change-password-input-icon">
                <Lock size={20} strokeWidth={1.8} />
              </span>
              <input
                id="old-password"
                type={showOldPassword ? 'text' : 'password'}
                className="change-password-input"
                placeholder="Nhập mật khẩu hiện tại"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="change-password-toggle-btn"
                onClick={() => setShowOldPassword(!showOldPassword)}
                aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showOldPassword ? <Eye size={20} strokeWidth={1.8} /> : <EyeOff size={20} strokeWidth={1.8} />}
              </button>
            </div>

            {/* Mật khẩu mới */}
            <div className="change-password-input-wrapper">
              <span className="change-password-input-icon">
                <Lock size={20} strokeWidth={1.8} />
              </span>
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                className="change-password-input"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="change-password-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showNewPassword ? <Eye size={20} strokeWidth={1.8} /> : <EyeOff size={20} strokeWidth={1.8} />}
              </button>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="change-password-input-wrapper">
              <span className="change-password-input-icon">
                <Lock size={20} strokeWidth={1.8} />
              </span>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="change-password-input"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="change-password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? <Eye size={20} strokeWidth={1.8} /> : <EyeOff size={20} strokeWidth={1.8} />}
              </button>
            </div>

            {/* Nút submit */}
            <button
              type="submit"
              className="btn-change-password-submit"
              disabled={isSubmitting}
            >
              <RotateCcw size={18} strokeWidth={2.5} />
              <span>{isSubmitting ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}</span>
            </button>
          </form>
        </main>

        <Toast message={message} visible={visible} />
      </div>
    </ProtectedScreen>
  )
}
