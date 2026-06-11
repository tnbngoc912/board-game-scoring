import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import { Header } from '../components/Header'
import { Icon } from '../components/ui/Icon'
import { PasswordInput } from '../components/ui/PasswordInput'

export function ChangePasswordShell() {
  const router = useRouter()
  const { changePassword } = useAuthStore()
  const { message, visible, show: showToast } = useToast()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            <PasswordInput
              id="old-password"
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />

            {/* Mật khẩu mới */}
            <PasswordInput
              id="new-password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />

            {/* Xác nhận mật khẩu mới */}
            <PasswordInput
              id="confirm-password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />

            {/* Nút submit */}
            <button
              type="submit"
              className="btn-change-password-submit"
              disabled={isSubmitting}
            >
              <Icon src="/change-pass.png" size={24} color="currentColor" />
              <span>{isSubmitting ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}</span>
            </button>
          </form>
        </main>

        <Toast message={message} visible={visible} />
      </div>
    </ProtectedScreen>
  )
}
