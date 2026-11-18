import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '../store/authStore'
import { usePermissions } from '../hooks/usePermissions'
import { useGroupStore } from '../store/groupStore'
import { useAppDataStore } from '../store/appDataStore'
import { getGroupMembers } from '../api/backendService'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { GroupMembersModal } from '../components/group/GroupMembersModal'
import { GroupOnboardingView } from '../components/group/GroupOnboardingView'
import { GroupInfoCard } from '../components/group/GroupInfoCard'
import { BottomNav } from '../components/navigation/BottomNav'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import { Header } from '../components/Header'
import { PullToRefresh } from '../components/ui/PullToRefresh'
import { Icon } from '../components/ui/Icon'
import { useIsStandalone } from '../hooks/useIsStandalone'
import { disableFcmNotifications, enableFcmNotifications, hasEnabledFcmNotifications } from '../api/firebaseNotifications'

export function AccountShell() {
  const router = useRouter()
  const { user, logout, changePassword, refreshProfile } = useAuthStore()
  const { message, visible, show: showToast } = useToast()
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [isUpdatingPush, setIsUpdatingPush] = useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
  const [memberCount, setMemberCount] = useState(null)
  const [pendingMemberCount, setPendingMemberCount] = useState(0)
  const isStandalone = useIsStandalone()
  const { isAdmin, activeGroup } = usePermissions()
  const groups = useGroupStore((state) => state.groups)
  const selectGroup = useGroupStore((state) => state.selectGroup)
  const fetchMyGroups = useGroupStore((state) => state.fetchMyGroups)
  const fetchUsers = useAppDataStore((state) => state.fetchUsers)

  const activeGroups = useMemo(
    () => (groups || []).filter((g) => (g.my_status || 'ACTIVE') === 'ACTIVE'),
    [groups]
  )

  const roleLabel =
    activeGroup?.my_role === 'OWNER'
      ? 'Chủ nhóm'
      : activeGroup?.my_role === 'ADMIN'
        ? 'Quản trị'
        : 'Thành viên'

  const refreshMemberData = useCallback(async () => {
    if (!activeGroup?.id) {
      setMemberCount(null)
      setPendingMemberCount(0)
      return
    }
    try {
      const members = await getGroupMembers(activeGroup.id)
      const activeMembers = (members || []).filter((m) => (m.status || 'ACTIVE') === 'ACTIVE')
      setMemberCount(activeMembers.length)
      if (isAdmin) {
        const count = (members || []).filter((m) => m.status === 'PENDING').length
        setPendingMemberCount(count)
      } else {
        setPendingMemberCount(0)
      }
    } catch {
      setPendingMemberCount(0)
    }
  }, [activeGroup?.id, isAdmin])

  useEffect(() => {
    refreshMemberData()
  }, [refreshMemberData])

  useEffect(() => {
    setIsPushEnabled(hasEnabledFcmNotifications())
  }, [])

  useEffect(() => {
    refreshProfile().catch(() => {})
  }, [refreshProfile])

  function handleLogout() {
    logout()
    router.replace('/')
  }

  async function handleTogglePush() {
    if (isUpdatingPush) return

    setIsUpdatingPush(true)
    try {
      if (isPushEnabled) {
        await disableFcmNotifications()
        setIsPushEnabled(false)
        showToast('Đã tắt thông báo')
      } else {
        await enableFcmNotifications()
        setIsPushEnabled(true)
        showToast('Đã bật thông báo')
      }
    } catch (error) {
      showToast(error?.message || 'Không cập nhật được thông báo')
    } finally {
      setIsUpdatingPush(false)
    }
  }

  return (
    <ProtectedScreen>
      <div className="app-shell screen-account">
        <div className="account-screen has-ptr">
          <Header />

          <PullToRefresh onRefresh={async () => {
            try {
              await Promise.all([refreshProfile(), refreshMemberData()])
              showToast('Đã làm mới thông tin tài khoản')
            } catch (err) {
              showToast('Không thể làm mới dữ liệu')
            }
          }}>
            <div className="account-content">
            {user && (
              <>
                <div className="account-profile-card">
                  <div className="account-avatar-wrapper">
                    {user.avatar_url ? (
                      <Image 
                        src={user.avatar_url} 
                        alt="" 
                        className="account-avatar-image" 
                        width={64}
                        height={64}
                        priority
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="account-avatar-icon">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <div className="account-user-info">
                    <div className="account-user-name">{user?.name || 'Người dùng ScoreKeeper'}</div>
                    <div className="account-user-badge">{user?.role || 'Thành viên'}</div>
                  </div>
                </div>

                <div className="account-email-section">
                  <div className="account-email-label">EMAIL</div>
                  <div className="account-email-box">
                    <Icon src="/email.png" size={24} color="#38322E" />
                    <span>{user?.email}</span>
                  </div>
                </div>

                <div className="account-email-section">
                  <div className="account-email-label">CÂU LẠC BỘ / NHÓM CHƠI</div>
                  <GroupInfoCard
                    group={activeGroup}
                    activeGroups={activeGroups}
                    roleLabel={roleLabel}
                    subtitle={memberCount !== null ? `${memberCount} thành viên` : undefined}
                    onSelectGroup={(nextId) => {
                      selectGroup(nextId)
                      showToast('Đã chuyển nhóm chơi')
                    }}
                  />
                </div>
              </>
            )}

            <div className="account-actions">
              {activeGroup ? (
                <button
                  className="btn-account-action btn-account-action-with-meta"
                  type="button"
                  onClick={() => router.push('/group-games')}
                >
                  <Icon src="/plus-icon.svg" size={24} color="#38322E" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong>Thêm & Quản lý Tủ Game Nhóm</strong>
                    <small>
                      Thêm từ thư viện mẫu hoặc tạo game mới
                    </small>
                  </span>
                  <Icon src="/arrow-right.png" size={16} color="#70655c" style={{ alignSelf: 'center', marginLeft: 'auto', flexShrink: 0 }} />
                </button>
              ) : null}

              {activeGroup ? (
                <button
                  className="btn-account-action btn-account-action-with-meta"
                  type="button"
                  onClick={() => setIsMembersModalOpen(true)}
                >
                  <Icon src="/person-user.png" size={24} color="#38322E" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Quản lý Nhóm & Thành viên</span>
                      {isAdmin && pendingMemberCount > 0 ? (
                        <span className="group-badge-count">{pendingMemberCount}</span>
                      ) : null}
                    </strong>
                    <small>
                      Mã mời: {activeGroup.invite_code || 'Đang tải'} • Duyệt & phân quyền
                    </small>
                  </span>
                </button>
              ) : null}

              <div className="account-quick-actions-grid">
                <button
                  className="btn-account-quick-action"
                  type="button"
                  onClick={() => setIsAddGroupModalOpen(true)}
                >
                  <Icon src="/home.png" size={24} color="#38322E" />
                  <div className="account-quick-action-text">
                    <strong>Gia nhập nhóm</strong>
                    <small>Nhập mã mời</small>
                  </div>
                </button>

                <button 
                  className="btn-account-quick-action" 
                  type="button"
                  onClick={handleTogglePush}
                  disabled={isUpdatingPush}
                >
                  <Icon
                    src={isPushEnabled ? "/notification-filled.png" : "/notification.png"}
                    size={24}
                    color={isPushEnabled ? "var(--color-brand)" : "#70655C"}
                  />
                  <div className="account-quick-action-text">
                    <strong>Thông báo</strong>
                    <small>
                      {isUpdatingPush ? 'Đang cập nhật...' : isPushEnabled ? 'Đang bật' : 'Đang tắt'}
                    </small>
                  </div>
                </button>
              </div>

              <button 
                className="btn-account-action" 
                type="button"
                onClick={() => router.push('/change-password')}
              >
                <Icon src="/change-pass.png" size={24} color="#38322E" />
                Đổi mật khẩu
              </button>

              <button 
                className="btn-account-action" 
                type="button" 
                onClick={handleLogout}
              >
                <Icon src="/logout.png" size={24} color="#38322E" />
                Đăng xuất
              </button>
            </div>

            <div className="account-footer">
              <div className="account-footer-brand">BGSCORE</div>
              <div className="account-footer-version">Version 1.0.0 (Build 100)</div>
            </div>
          </div>
          </PullToRefresh>
        </div>

        <GroupMembersModal
          isOpen={isMembersModalOpen}
          group={activeGroup}
          canManage={isAdmin}
          onClose={() => setIsMembersModalOpen(false)}
          onUpdated={() => {
            fetchUsers({ force: true }).catch(() => {})
            fetchMyGroups({ force: true }).catch(() => {})
            refreshMemberData()
          }}
          toast={showToast}
        />

        {isAddGroupModalOpen ? (
          <GroupOnboardingView
            isModal
            toast={showToast}
            onClose={() => setIsAddGroupModalOpen(false)}
            onSuccess={() => {
              fetchMyGroups({ force: true }).catch(() => {})
              fetchUsers({ force: true }).catch(() => {})
              refreshMemberData()
            }}
          />
        ) : null}

        <BottomNav />
        <Toast message={message} visible={visible} />
      </div>
    </ProtectedScreen>
  )
}
