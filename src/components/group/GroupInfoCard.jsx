import React from 'react'
import { ChevronsUpDown } from 'lucide-react'

/**
 * Component hiển thị thông tin nhóm hiện tại (GroupInfoCard).
 * Tái sử dụng ở trang Profile (Account), trang Tủ Game (GroupGames), v.v.
 * Thiết kế theo phong cách Linear/Notion Workspace Switcher.
 *
 * @param {object} group Thông tin nhóm hiện tại
 * @param {Array<object>} activeGroups Danh sách các nhóm active của user
 * @param {string} roleLabel Nhãn vai trò (Chủ nhóm / Quản trị / Thành viên)
 * @param {string} subtitle Thông tin phụ (số lượng thành viên, số lượng game...)
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

  const canSwitch = activeGroups.length > 1 && typeof onSelectGroup === 'function'

  return (
    <div className="group-info-card">
      <div className="group-info-main">
        <div className="group-info-name" title={group?.name || 'Chưa tham gia nhóm'}>
          {group?.name || 'Chưa tham gia nhóm'}
        </div>
        {group && <span className="group-role-badge">{resolvedRole}</span>}
        {subtitle && (
          <span className="group-info-meta-sub">
            <span className="group-info-meta-dot">•</span>
            {subtitle}
          </span>
        )}
      </div>

      {rightAction ? (
        rightAction
      ) : canSwitch ? (
        <div className="group-switcher-trigger" title="Nhấn để đổi nhóm chơi">
          <span className="group-switcher-label">Đổi</span>
          <ChevronsUpDown size={14} className="group-switcher-icon" />
          <select
            className="group-switcher-native-select"
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
  )
}
