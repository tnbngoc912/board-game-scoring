import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function ChangePasswordModal({ isOpen, onClose, onSubmit, toast }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // States ẩn hiện mật khẩu
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast('Vui lòng điền đầy đủ thông tin')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('Mật khẩu mới không trùng khớp')
      return
    }
    try {
      setIsSubmitting(true)
      await onSubmit(oldPassword, newPassword)
      toast('Đổi mật khẩu thành công')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
    } catch (error) {
      toast(error?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="password-modal-overlay" onClick={onClose}>
      <div className="password-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Đổi mật khẩu</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="password-form-group">
            <label htmlFor="old-pass">Mật khẩu cũ</label>
            <div className="password-input-wrapper">
              <input
                id="old-pass"
                className="password-input"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowOldPassword(!showOldPassword)}
                aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="password-form-group">
            <label htmlFor="new-pass">Mật khẩu mới</label>
            <div className="password-input-wrapper">
              <input
                id="new-pass"
                className="password-input"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="password-form-group">
            <label htmlFor="confirm-pass">Xác nhận mật khẩu mới</label>
            <div className="password-input-wrapper">
              <input
                id="confirm-pass"
                className="password-input"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="password-modal-buttons">
            <button 
              className="btn-password-cancel" 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button 
              className="btn-password-submit" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
