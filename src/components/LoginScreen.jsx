import Image from "next/image"
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Header } from './Header'

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
      <Header />

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
                {showPassword ? <Eye size={20} strokeWidth={1.8} /> : <EyeOff size={20} strokeWidth={1.8} />}
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
