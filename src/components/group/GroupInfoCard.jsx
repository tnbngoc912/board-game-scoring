import React from 'react'

/**
 * Component hiển thị thông tin nhóm hiện tại (GroupInfoCard).
 * Tái sử dụng ở trang Profile (Account), trang Tủ Game (GroupGames), v.v.
 *
 * @param {object} group Thông tin nhóm hiện tại
 * @param {Array<object>} activeGroups Danh sách các nhóm active của user
 * @param {string} roleLabel Nhãn vai trò (Chủ nhóm / Quản trị / Thành viên)
 * @param {string} subtitle Thông tin phụ (số lượng game, mã mời...)
 * @param {(groupId: string) => void} onSelectGroup Callback khi chuyển nhóm qua select
 * @param {React.ReactNode} rightAction Component phụ ở góc phải
 */
export function GroupInfoCard({
  group,
  activeGroups = [],
  roleLabel,
  subtitle,
  onSelectGroup,
  rightAction,
}) {
  const resolvedRole =
    roleLabel ||
    (group?.my_role === 'OWNER'
      ? 'Chủ nhóm'
      : group?.my_role === 'ADMIN'
        ? 'Quản trị'
        : 'Thành viên')

  return (
    <div className="account-profile-card" style={{ padding: '16px' }}>
      <div className="account-user-info" style={{ width: '100%', minWidth: 0, gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
          <div className="account-user-name" style={{ fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group?.name || 'Chưa tham gia nhóm'}
          </div>
          {rightAction}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {group && <span className="group-role-badge">{resolvedRole}</span>}
          {subtitle && (
            <span style={{ fontSize: 13, color: 'var(--color-subtext)' }}>
              • {subtitle}
            </span>
          )}
        </div>

        {activeGroups.length > 1 && onSelectGroup ? (
          <div style={{ width: '100%', marginTop: 4 }}>
            <select
              className="group-switcher-select"
              style={{
                width: '100%',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border-control)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text-strong)',
              }}
              value={group?.id || ''}
              onChange={(e) => onSelectGroup(e.target.value)}
              aria-label="Chọn nhóm chơi hoạt động"
            >
              {activeGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  🎲 {g.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
    </div>
  )
}
