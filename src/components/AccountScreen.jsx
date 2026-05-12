import React from 'react'

export function AccountScreen({ user, onLogout }) {
  return (
    <div className="screen history-screen">
      <header className="history-phone-header" aria-label="BGScore">
        <div className="history-brandbar">
          <div className="home-logo">BGSCORE</div>
        </div>
      </header>

      <div className="screen-inner history-content">
        <section className="paper-card login-card">
          <h2>Tài khoản</h2>
          <p><strong>{user?.name || 'Người dùng'}</strong></p>
          <p>{user?.email || ''}</p>
          <button className="setup-start-btn" type="button" onClick={onLogout}>
            Đăng xuất
          </button>
        </section>
      </div>
    </div>
  )
}
