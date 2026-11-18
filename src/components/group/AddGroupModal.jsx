import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { SwitchTabs } from '../ui/SwitchTabs'
import { useGroupStore } from '../../store/groupStore'

/**
 * Modal popup ở giữa màn hình cho phép người dùng nhập mã tham gia nhóm
 * hoặc tự tạo nhóm mới (thay thế bottom sheet).
 * Bấm vào nền mờ (backdrop) bên ngoài để đóng modal.
 */
export function AddGroupModal({ isOpen, onClose, toast, onSuccess }) {
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

  if (!isOpen) return null

  const pendingGroups = (groups || []).filter((g) => g.my_status === 'PENDING')

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
      onSuccess?.()
      if (!result?.pendingApproval) {
        onClose?.()
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
      setGroupName('')
      setGroupDesc('')
      onSuccess?.()
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
      const hasActive = (updated || []).some((g) => g.my_status === 'ACTIVE')
      if (hasActive) {
        toast?.('Yêu cầu của bạn đã được phê duyệt!')
        onSuccess?.()
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
    <div className="add-group-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="add-group-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="add-group-modal-header">
          <div className="add-group-modal-title-wrap">
            <h2 className="add-group-modal-title">Tham Gia / Tạo Nhóm</h2>
            <p className="add-group-modal-subtitle">
              Nhập mã mời từ Chủ nhóm hoặc tự lập nhóm mới cho hội bạn
            </p>
          </div>
          <button
            type="button"
            className="add-group-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng popup"
          >
            ✕
          </button>
        </div>

        <div className="add-group-modal-body">
          {pendingGroups.length > 0 ? (
            <div className="group-pending-banner" role="status" style={{ margin: 0 }}>
              <div className="group-pending-banner-title">
                ⏳ Đang chờ duyệt ({pendingGroups.length})
              </div>
              <div className="group-pending-banner-desc">
                Nhóm:{' '}
                <strong>{pendingGroups.map((g) => g.name).join(', ')}</strong>. Vui lòng chờ Chủ nhóm phê duyệt.
              </div>
              <Button
                variant="secondary"
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                {isRefreshing ? 'Đang kiểm tra...' : 'Kiểm tra lại trạng thái'}
              </Button>
            </div>
          ) : null}

          <SwitchTabs
            options={[
              { value: 'join', label: 'Nhập mã nhóm' },
              { value: 'create', label: 'Tạo nhóm mới' },
            ]}
            value={activeTab}
            onChange={(nextTab) => setActiveTab(nextTab)}
            layoutId="add-group-modal-tab"
            ariaLabel="Chế độ tham gia nhóm"
          />

          {activeTab === 'join' ? (
            <form className="group-form" onSubmit={handleJoinByCode} style={{ marginTop: 'var(--space-1)' }}>
              <div className="group-field">
                <label htmlFor="modal-invite-code-input">Mã mời nhóm</label>
                <Input
                  id="modal-invite-code-input"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã nhóm..."
                  autoCapitalize="characters"
                />
              </div>

              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu tham gia'}
              </Button>
            </form>
          ) : (
            <form className="group-form" onSubmit={handleCreateGroup} style={{ marginTop: 'var(--space-1)' }}>
              <div className="group-field">
                <label htmlFor="modal-group-name-input">Tên nhóm / Câu lạc bộ *</label>
                <Input
                  id="modal-group-name-input"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Hội Board Game Cuối Tuần"
                />
              </div>

              <div className="group-field">
                <label htmlFor="modal-group-desc-input">Mô tả ngắn (Tùy chọn)</label>
                <textarea
                  id="modal-group-desc-input"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Ghi chú về nhóm chơi của bạn..."
                  rows={3}
                />
              </div>

              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                {isSubmitting ? 'Đang tạo nhóm...' : 'Tạo nhóm mới & Làm Chủ nhóm'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
