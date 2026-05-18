'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ForgotPasswordScreen } from '../../components/ForgotPasswordScreen'
import { Toast } from '../../components/Toast'
import { useToast } from '../../hooks/useToast'
import { useAuthStore } from '../../store/authStore'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const forgotPassword = useAuthStore((state) => state.forgotPassword)
  const { message, visible, show } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(email) {
    if (!email) {
      show('Vui lòng nhập email')
      return
    }
    try {
      setIsSubmitting(true)
      await forgotPassword(email)
      show('Mật khẩu mới đã được gửi vào email của bạn')
    } catch (error) {
      show(error?.message || 'Không thể gửi mật khẩu mới')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell screen-setup">
      <ForgotPasswordScreen
        onSubmit={handleSubmit}
        onBack={() => router.push('/')}
        isSubmitting={isSubmitting}
      />
      <Toast message={message} visible={visible} />
    </div>
  )
}
