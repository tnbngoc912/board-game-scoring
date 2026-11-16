import React from 'react'

export function GroupHeaderBar({
  activeGroups = [],
  activeGroup,
  canManageGroup,
  canCreateBoardGame,
  pendingMemberCount = 0,
  onSelectGroup,
  onOpenOnboardingModal,
  onOpenMembersModal,
  onOpenCatalogModal,
  onOpenQuickCreateModal,
}) {
  if (!activeGroup) return null

  const roleLabel =
    activeGroup.my_role === 'OWNER'
      ? 'Chủ nhóm'
      : activeGroup.my_role === 'ADMIN'
        ? 'Quản trị'
        : 'Thành viên'

  return (
    <section className="group-header-bar" aria-label="Không gian nhóm hiện tại">
      <div className="group-switcher-left">
        <select
          className="group-switcher-select"
          aria-label="Chuyển đổi nhóm"
          value={activeGroup.id}
          onChange={(e) => {
            if (e.target.value === '__ADD_GROUP__') {
              onOpenOnboardingModal?.()
              return
            }
            onSelectGroup?.(e.target.value)
          }}
        >
          {activeGroups.map((g) => (
            <option key={g.id} value={g.id}>
              🎲 {g.name}
            </option>
          ))}
          <option value="__ADD_GROUP__">+ Nhập mã / Tạo nhóm mới...</option>
        </select>

        <span className="group-role-badge">{roleLabel}</span>
      </div>

      <div className="group-toolbar-actions">
        <button
          type="button"
          className="group-action-chip"
          onClick={onOpenMembersModal}
        >
          👥 Thành viên
          {canManageGroup && pendingMemberCount > 0 ? (
            <span className="group-badge-count">{pendingMemberCount}</span>
          ) : null}
        </button>

        {canCreateBoardGame ? (
          <>
            <button
              type="button"
              className="group-action-chip"
              onClick={onOpenCatalogModal}
            >
              + Thư viện mẫu
            </button>
            <button
              type="button"
              className="group-action-chip primary"
              onClick={onOpenQuickCreateModal}
            >
              + Tạo game nhanh
            </button>
          </>
        ) : null}
      </div>
    </section>
  )
}
