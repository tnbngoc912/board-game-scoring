import Image from "next/image"
import React, { useState } from 'react'

export function ForgotPasswordScreen({ onSubmit, onBack, isSubmitting }) {
  const [email, setEmail] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    await onSubmit(email.trim())
  }

  return (
    <div className="screen login-screen">
      <header className="home-header">
        <div className="home-logo">BGSCORE</div>
      </header>

      <div className="screen-inner login-content">
        <section className="paper-card login-card forgot">
          <h1>Quên mật khẩu</h1>
          <p className="txt-forgot">Xác nhận email của bạn.<br />
            Hệ thống sẽ gửi mật khẩu về lại email đó.</p>
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

            <button className="setup-start-btn login-submit-btn" type="submit" disabled={isSubmitting}>
              <Image src="/send-icon.svg" aria-hidden="true" width={24} height={24} style={{ marginRight: 8 }} />

              {isSubmitting ? 'Đang gửi...' : 'Gửi mật khẩu về email'}
            </button>
          </form>

          <button className="forgot-link-btn" type="button" onClick={onBack}>
            Quay lại đăng nhập
          </button>
        </section>
      </div>
    </div >
  )
}
