import Image from "next/image"
import React, { useState } from 'react'

export function LoginScreen({ onLogin, onGoForgotPassword, isSubmitting }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    await onLogin(email.trim(), password)
  }

  return (
    <div className="screen login-screen">
      <header className="home-header">
        <div className="home-logo">BGSCORE</div>
      </header>

      <div className="screen-inner login-content">
        <section className="paper-card login-card">
          <h1>Đăng nhập</h1>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="input-with-icon">
              <span className="input-icon left" aria-hidden="true">
                <Image src="/email-icon.svg" alt="" width={24} height={24} />
              </span>
              <input
                type="email"
                required
                autoComplete="off"
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
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                className="input-icon-btn right"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M10.6 10.7a2 2 0 0 0 2.8 2.8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c4.9 0 8.7 3 10 7-0.4 1.2-1.1 2.4-2 3.4" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M6.2 8.2C5 9.2 4 10.5 3.4 12c1.3 4 5.1 7 10 7 1 0 2-.1 2.9-.4" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </label>

            <button className="setup-start-btn login-submit-btn" type="submit" disabled={isSubmitting}>
              <Image src="/login-icon.svg" aria-hidden="true" width={24} height={24} style={{ marginRight: 8 }} />
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <button className="forgot-link-btn" type="button" onClick={onGoForgotPassword}>
            Quên mật khẩu?
          </button>
        </section>
      </div>
    </div>
  )
}
