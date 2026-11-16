import Image from "next/image"
import React, { useState } from 'react'
import { Eye, EyeOff, User as UserIcon } from 'lucide-react'
import { Header } from './Header'

export function LoginScreen({
  onLogin,
  onRegister,
  onGoForgotPassword,
  isSubmitting,
  initialMode = 'login',
  onValidationError,
}) {
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanEmail = email.trim()
    if (mode === 'register') {
      const cleanName = name.trim()
      if (cleanName.length < 2) {
        onValidationError?.('Tên hiển thị cần ít nhất 2 ký tự')
        return
      }
      if (password.length < 6) {
        onValidationError?.('Mật khẩu cần ít nhất 6 ký tự')
        return
      }
      if (password !== confirmPassword) {
        onValidationError?.('Mật khẩu xác nhận không khớp')
        return
      }
      await onRegister?.({ name: cleanName, email: cleanEmail, password })
      return
    }

    await onLogin(cleanEmail, password)
  }

  return (
    <div className="screen login-screen">
      <Header />

      <div className="screen-inner login-content">
        <section className="paper-card login-card">
          <div className="login-mode-tabs" role="tablist" aria-label="Chế độ xác thực">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`login-mode-tab${mode === 'login' ? ' active' : ''}`}
              onClick={() => setMode('login')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`login-mode-tab${mode === 'register' ? ' active' : ''}`}
              onClick={() => setMode('register')}
            >
              Đăng ký
            </button>
          </div>

          <h1>{mode === 'register' ? 'Đăng ký tài khoản' : 'Đăng nhập'}</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label className="input-with-icon">
                <span className="input-icon left" aria-hidden="true">
                  <UserIcon size={22} strokeWidth={1.8} />
                </span>
                <input
                  type="text"
                  required
                  minLength={2}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tên hiển thị của bạn"
                />
              </label>
            ) : null}

            <label className="input-with-icon">
              <span className="input-icon left" aria-hidden="true">
                <Image src="/email-icon.svg" alt="" width={24} height={24} />
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Nhập email"
              />
            </label>

            <label className="input-with-icon">
              <span className="input-icon left" aria-hidden="true">
                <Image src="/lock-icon.svg" alt="" width={24} height={24} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={mode === 'register' ? 6 : undefined}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'register' ? 'Mật khẩu (tối thiểu 6 ký tự)' : 'Nhập mật khẩu'}
              />
              <button
                type="button"
                className="input-icon-btn right"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <Eye size={20} strokeWidth={1.8} /> : <EyeOff size={20} strokeWidth={1.8} />}
              </button>
            </label>

            {mode === 'register' ? (
              <label className="input-with-icon">
                <span className="input-icon left" aria-hidden="true">
                  <Image src="/lock-icon.svg" alt="" width={24} height={24} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Xác nhận lại mật khẩu"
                />
                <button
                  type="button"
                  className="input-icon-btn right"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                >
                  {showConfirmPassword ? <Eye size={20} strokeWidth={1.8} /> : <EyeOff size={20} strokeWidth={1.8} />}
                </button>
              </label>
            ) : null}

            <button className="setup-start-btn login-submit-btn" type="submit" disabled={isSubmitting}>
              <Image src="/login-icon.svg" aria-hidden="true" width={24} height={24} style={{ marginRight: 8 }} />
              {isSubmitting
                ? mode === 'register'
                  ? 'Đang tạo tài khoản...'
                  : 'Đang đăng nhập...'
                : mode === 'register'
                  ? 'Đăng ký ngay'
                  : 'Đăng nhập'}
            </button>
          </form>

          {mode === 'login' ? (
            <button className="forgot-link-btn" type="button" onClick={onGoForgotPassword}>
              Quên mật khẩu?
            </button>
          ) : null}
        </section>
      </div>
    </div>
  )
}
