import React, { useState } from 'react'
import { Header } from '../Header'
import { useGroupStore } from '../../store/groupStore'
import { useAuthStore } from '../../store/authStore'

export function GroupOnboardingView({ toast, onClose }) {
  const [activeTab, setActiveTab] = useState('join')
  const [inviteCode, setInviteCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const groups = useGroupStore((state) => state.groups)
  const fetchMyGroups = useGroupStore((state) => state.fetchMyGroups)
  const joinGroup = useGroupStore((state) => state.joinGroup)
  const createGroup = useGroupStore((state) => state.createGroup)
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

  const pendingGroups = groups.filter((g) => g.my_status === 'PENDING')

  async function handleJoinByCode(event) {
    event.preventDefault()
    const cleanCode = inviteCode.trim().toUpperCase()
    if (!cleanCode) {
      toast?.('Vui lòng nhập mã nhóm')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await joinGroup(cleanCode)
      setInviteCode('')
      toast?.(
        result?.message ||
          (result?.pendingApproval
            ? 'Đã gửi yêu cầu tham gia. Vui lòng chờ Chủ nhóm phê duyệt'
            : 'Tham gia nhóm thành công')
      )
      if (!result?.pendingApproval && onClose) {
        onClose()
      }
    } catch (error) {
      toast?.(error?.message || 'Không thể tham gia nhóm bằng mã này')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreateGroup(event) {
    event.preventDefault()
    const cleanName = groupName.trim()
    if (!cleanName) {
      toast?.('Vui lòng nhập tên nhóm')
      return
    }

    setIsSubmitting(true)
    try {
      await createGroup({
        name: cleanName,
        description: groupDesc.trim(),
      })
      toast?.('Đã tạo nhóm mới thành công!')
      onClose?.()
    } catch (error) {
      toast?.(error?.message || 'Không thể tạo nhóm mới')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRefreshStatus() {
    setIsRefreshing(true)
    try {
      const updated = await fetchMyGroups({ force: true })
      const hasActive = updated.some((g) => g.my_status === 'ACTIVE')
      if (hasActive) {
        toast?.('Yêu cầu của bạn đã được phê duyệt!')
        onClose?.()
      } else {
        toast?.('Yêu cầu vẫn đang chờ Chủ nhóm phê duyệt')
      }
    } catch {
      toast?.('Không thể kiểm tra trạng thái nhóm')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="group-onboarding-shell">
      <Header
        title="Chọn Nhóm Chơi"
        onClose={onClose}
      />

      <div className="group-onboarding-body">
        {pendingGroups.length > 0 ? (
          <div className="group-pending-banner" role="status">
            <div className="group-pending-banner-title">
              ⏳ Đang chờ Chủ nhóm phê duyệt ({pendingGroups.length})
            </div>
            <div className="group-pending-banner-desc">
              Bạn đã gửi yêu cầu tham gia nhóm:{' '}
              <strong>{pendingGroups.map((g) => g.name).join(', ')}</strong>. Sau khi Chủ nhóm duyệt, bạn sẽ truy cập được Tủ game và Lịch sử của nhóm.
            </div>
            <button
              type="button"
              className="group-btn-secondary"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Đang kiểm tra...' : 'Kiểm tra lại trạng thái'}
            </button>
          </div>
        ) : null}

        <section className="group-onboarding-card">
          <div className="group-onboarding-title">
            Xin chào{user?.name ? `, ${user.name}` : ''}!
          </div>
          <p className="group-onboarding-subtitle">
            Nhập mã mời từ Chủ nhóm để tham gia hội chơi có sẵn, hoặc tự tạo nhóm mới cho hội bạn của mình.
          </p>

          <div className="group-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'join'}
              className={`group-tab-btn${activeTab === 'join' ? ' active' : ''}`}
              onClick={() => setActiveTab('join')}
            >
              Nhập mã nhóm
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'create'}
              className={`group-tab-btn${activeTab === 'create' ? ' active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Tạo nhóm mới
            </button>
          </div>

          {activeTab === 'join' ? (
            <form className="group-form" onSubmit={handleJoinByCode}>
              <div className="group-field">
                <label htmlFor="invite-code-input">Mã mời nhóm (Do Chủ nhóm cung cấp)</label>
                <input
                  id="invite-code-input"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã nhóm..."
                  autoCapitalize="characters"
                />
              </div>

              <button type="submit" className="group-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu tham gia'}
              </button>
            </form>
          ) : (
            <form className="group-form" onSubmit={handleCreateGroup}>
              <div className="group-field">
                <label htmlFor="group-name-input">Tên nhóm / Câu lạc bộ *</label>
                <input
                  id="group-name-input"
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Hội Board Game Cuối Tuần"
                />
              </div>

              <div className="group-field">
                <label htmlFor="group-desc-input">Mô tả ngắn (Tùy chọn)</label>
                <textarea
                  id="group-desc-input"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Ghi chú về nhóm chơi của bạn..."
                />
              </div>

              <button type="submit" className="group-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo nhóm...' : 'Tạo nhóm mới & Làm Chủ nhóm'}
              </button>
            </form>
          )}
        </section>

        {!onClose ? (
          <button
            type="button"
            className="group-btn-secondary"
            onClick={() => logout()}
          >
            Đăng xuất tài khoản
          </button>
        ) : null}
      </div>
    </div>
  )
}
