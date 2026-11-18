import React, { useCallback, useEffect, useState } from 'react'
import {
  approveGroupMember,
  createVirtualMember,
  deleteGroupMember,
  getGroupMembers,
  rejectGroupMember,
  updateGroupMemberPermissions,
} from '../../api/backendService'

const PERMISSION_RESOURCES = [
  { key: 'MATCH', label: 'Trận đấu & Điểm số' },
  { key: 'BOARDGAME', label: 'Tủ Game Nhóm' },
  { key: 'USER', label: 'Thành viên' },
  { key: 'CATEGORY', label: 'Thể loại' },
]

const PERMISSION_ACTIONS = [
  { key: 'READ', label: 'Xem' },
  { key: 'CREATE', label: 'Tạo' },
  { key: 'EDIT', label: 'Sửa' },
  { key: 'DELETE', label: 'Xóa' },
]

function getDefaultPerms(raw) {
  return {
    MATCH: Array.isArray(raw?.MATCH) ? [...raw.MATCH] : ['READ'],
    BOARDGAME: Array.isArray(raw?.BOARDGAME) ? [...raw.BOARDGAME] : ['READ'],
    USER: Array.isArray(raw?.USER) ? [...raw.USER] : ['READ'],
    CATEGORY: Array.isArray(raw?.CATEGORY) ? [...raw.CATEGORY] : ['READ'],
  }
}

export function GroupMembersModal({
  isOpen,
  group,
  canManage,
  onClose,
  onUpdated,
  toast,
}) {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [virtualName, setVirtualName] = useState('')
  const [isAddingVirtual, setIsAddingVirtual] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState('')
  const [draftPermissions, setDraftPermissions] = useState(getDefaultPerms(null))
  const [isSavingPerms, setIsSavingPerms] = useState(false)
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null)

  const groupId = group?.id || group?._id

  const loadMembers = useCallback(async () => {
    if (!groupId) return
    setIsLoading(true)
    try {
      const list = await getGroupMembers(groupId)
      setMembers(list || [])
    } catch {
      toast?.('Không thể tải danh sách thành viên nhóm')
    } finally {
      setIsLoading(false)
    }
  }, [groupId, toast])

  useEffect(() => {
    if (isOpen && groupId) {
      loadMembers()
    }
  }, [isOpen, groupId, loadMembers])

  if (!isOpen || !group) return null

  const pendingMembers = members.filter((m) => m.status === 'PENDING')
  const activeMembers = members.filter((m) => (m.status || 'ACTIVE') === 'ACTIVE')
  const removedMembers = members.filter((m) => m.status === 'REMOVED')

  async function handleCopyInviteCode() {
    if (!group.invite_code) return
    try {
      await navigator.clipboard.writeText(group.invite_code)
      toast?.('Đã sao chép mã mời')
    } catch {
      toast?.(`Mã mời nhóm: ${group.invite_code}`)
    }
  }

  async function handleApprove(member) {
    const mid = member._id || member.id
    try {
      await approveGroupMember(groupId, mid)
      toast?.(`Đã duyệt "${member.display_name}" vào nhóm (Mặc định quyền Xem)`)
      await loadMembers()
      onUpdated?.()
    } catch (error) {
      toast?.(error?.message || 'Không thể phê duyệt thành viên')
    }
  }

  async function handleReject(member) {
    const mid = member._id || member.id
    try {
      await rejectGroupMember(groupId, mid)
      toast?.(`Đã từ chối yêu cầu của "${member.display_name}"`)
      await loadMembers()
      onUpdated?.()
    } catch (error) {
      toast?.(error?.message || 'Không thể từ chối yêu cầu')
    }
  }

  async function handleAddVirtual(event) {
    event.preventDefault()
    const cleanName = virtualName.trim()
    if (!cleanName) return

    setIsAddingVirtual(true)
    try {
      await createVirtualMember(groupId, { display_name: cleanName })
      setVirtualName('')
      toast?.(`Đã thêm bạn chơi ảo "${cleanName}"`)
      await loadMembers()
      onUpdated?.()
    } catch (error) {
      toast?.(error?.message || 'Không thể tạo người chơi ảo')
    } finally {
      setIsAddingVirtual(false)
    }
  }

  function openPermissionEditor(member) {
    const mid = String(member._id || member.id)
    if (editingMemberId === mid) {
      setEditingMemberId('')
      return
    }
    setEditingMemberId(mid)
    setDraftPermissions(getDefaultPerms(member.permissions))
  }

  function togglePermissionAction(resourceKey, actionKey) {
    if (actionKey === 'READ') return
    setDraftPermissions((prev) => {
      const current = prev[resourceKey] || ['READ']
      const exists = current.includes(actionKey)
      const next = exists
        ? current.filter((a) => a !== actionKey)
        : [...current, actionKey]
      if (!next.includes('READ')) next.unshift('READ')
      return {
        ...prev,
        [resourceKey]: next,
      }
    })
  }

  async function handleSavePermissions(member) {
    const mid = member._id || member.id
    setIsSavingPerms(true)
    try {
      await updateGroupMemberPermissions(groupId, mid, draftPermissions)
      toast?.(`Đã cập nhật quyền cho "${member.display_name}"`)
      setEditingMemberId('')
      await loadMembers()
      onUpdated?.()
    } catch (error) {
      toast?.(error?.message || 'Không thể lưu phân quyền')
    } finally {
      setIsSavingPerms(false)
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteMember) return
    const mid = confirmDeleteMember._id || confirmDeleteMember.id
    try {
      const res = await deleteGroupMember(groupId, mid)
      toast?.(res?.message || `Đã xóa "${confirmDeleteMember.display_name}" khỏi nhóm`)
      setConfirmDeleteMember(null)
      await loadMembers()
      onUpdated?.()
    } catch (error) {
      toast?.(error?.message || 'Không thể xóa thành viên')
    }
  }

  return (
    <div className="group-modal-backdrop" onClick={onClose}>
      <div className="group-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="group-modal-header">
          <h2>Thành Viên Nhóm — {group.name}</h2>
          <button type="button" className="group-modal-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className="group-modal-body">
          {group.invite_code ? (
            <div className="group-invite-box">
              <div>
                <div className="group-member-sub">MÃ MỜI THAM GIA NHÓM</div>
                <div className="group-invite-code">{group.invite_code}</div>
              </div>
              <button type="button" className="group-btn-secondary" onClick={handleCopyInviteCode}>
                Sao chép mã
              </button>
            </div>
          ) : null}

          {canManage && pendingMembers.length > 0 ? (
            <section className="group-pending-banner">
              <div className="group-pending-banner-title">
                Chờ phê duyệt ({pendingMembers.length})
              </div>
              <div className="group-member-list">
                {pendingMembers.map((member) => {
                  const mid = String(member._id || member.id)
                  const email = member.user_id?.email || ''
                  return (
                    <div key={mid} className="group-member-card">
                      <div className="group-member-top">
                        <div>
                          <div className="group-member-name">{member.display_name}</div>
                          {email ? <div className="group-member-sub">{email}</div> : null}
                        </div>
                        <div className="group-member-actions">
                          <button
                            type="button"
                            className="group-action-chip primary"
                            onClick={() => handleApprove(member)}
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            className="group-btn-danger"
                            onClick={() => handleReject(member)}
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          {canManage ? (
            <form className="group-field-row" onSubmit={handleAddVirtual}>
              <input
                type="text"
                className="group-virtual-input"
                value={virtualName}
                onChange={(e) => setVirtualName(e.target.value)}
                placeholder="Tên bạn chơi ảo (VD: Huy bạn Nam)"
              />
              <button type="submit" className="group-btn-secondary" disabled={isAddingVirtual}>
                {isAddingVirtual ? 'Đang thêm...' : '+ Người chơi ảo'}
              </button>
            </form>
          ) : null}

          {confirmDeleteMember ? (
            <div className="group-pending-banner" role="alertdialog">
              <div className="group-pending-banner-title">
                Xác nhận xóa "{confirmDeleteMember.display_name}"?
              </div>
              <div className="group-pending-banner-desc">
                Nếu thành viên đã từng chơi trận đấu trong nhóm, lịch sử các ván đấu cũ vẫn được giữ nguyên với trạng thái <strong>Đã rời nhóm</strong>.
              </div>
              <div className="group-member-actions">
                <button type="button" className="group-btn-danger" onClick={handleConfirmDelete}>
                  Xác nhận xóa khỏi nhóm
                </button>
                <button
                  type="button"
                  className="group-btn-secondary"
                  onClick={() => setConfirmDeleteMember(null)}
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : null}

          <div className="group-member-sub">
            THÀNH VIÊN ĐANG HOẠT ĐỘNG ({activeMembers.length})
          </div>

          {isLoading ? (
            <div className="group-note-box">Đang tải danh sách thành viên...</div>
          ) : (
            <div className="group-member-list">
              {activeMembers.map((member) => {
                const mid = String(member._id || member.id)
                const isOwner = member.role === 'OWNER'

                return (
                  <div key={mid} className="group-member-card">
                    <div className="group-member-top">
                      <div className="group-member-info">
                        <span className="group-member-name">{member.display_name}</span>
                        <span className="group-role-badge">
                          {isOwner
                            ? 'Chủ nhóm'
                            : member.is_virtual
                              ? 'Người chơi ảo'
                              : 'Thành viên'}
                        </span>
                      </div>

                      {canManage && !isOwner ? (
                        <div className="group-member-actions">
                          {!member.is_virtual ? (
                            <button
                              type="button"
                              className="group-action-chip"
                              onClick={() => openPermissionEditor(member)}
                            >
                              Phân quyền
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="group-btn-danger"
                            onClick={() => setConfirmDeleteMember(member)}
                          >
                            Xóa
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {editingMemberId === mid ? (
                      <div className="group-perm-box">
                        {PERMISSION_RESOURCES.map((resItem) => {
                          const currentActions = draftPermissions[resItem.key] || ['READ']
                          return (
                            <div key={resItem.key} className="group-perm-row">
                              <span className="group-perm-label">{resItem.label}</span>
                              <div className="group-perm-checks">
                                {PERMISSION_ACTIONS.map((act) => (
                                  <label key={act.key} className="group-perm-check">
                                    <input
                                      type="checkbox"
                                      checked={currentActions.includes(act.key)}
                                      disabled={act.key === 'READ'}
                                      onChange={() => togglePermissionAction(resItem.key, act.key)}
                                    />
                                    {act.label}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                        <div className="group-member-actions">
                          <button
                            type="button"
                            className="group-action-chip primary"
                            disabled={isSavingPerms}
                            onClick={() => handleSavePermissions(member)}
                          >
                            {isSavingPerms ? 'Đang lưu...' : 'Lưu quyền'}
                          </button>
                          <button
                            type="button"
                            className="group-action-chip"
                            onClick={() => setEditingMemberId('')}
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          {removedMembers.length > 0 ? (
            <>
              <div className="group-member-sub">
                ĐÃ RỜI NHÓM — BẢO TOÀN LỊCH SỬ ({removedMembers.length})
              </div>
              <div className="group-member-list">
                {removedMembers.map((member) => (
                  <div key={String(member._id || member.id)} className="group-member-card">
                    <div className="group-member-top">
                      <div>
                        <div className="group-member-name">
                          {member.display_name}{' '}
                          <span className="group-role-badge">Đã rời nhóm</span>
                        </div>
                        <div className="group-member-sub">
                          Đã bảo toàn lịch sử {member.stats?.played_count || 0} trận đấu
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
