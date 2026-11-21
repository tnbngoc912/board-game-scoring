import { useAuthStore } from '../store/authStore'
import { useGroupStore } from '../store/groupStore'

export function usePermissions() {
  const currentUser = useAuthStore((state) => state.user)
  const groups = useGroupStore((state) => state.groups)
  const activeGroupId = useGroupStore((state) => state.activeGroupId)

  const activeGroup =
    groups.find((g) => g.id === activeGroupId && g.my_status === 'ACTIVE') ||
    groups.find((g) => g.my_status === 'ACTIVE') ||
    null

  const isSystemAdmin = currentUser?.role === 'ADMIN'
  const groupRole = activeGroup?.my_role || null
  const isGroupOwnerOrAdmin = isSystemAdmin || groupRole === 'OWNER' || groupRole === 'ADMIN'
  const effectivePermissions = activeGroup?.my_permissions || currentUser?.permissions || {}

  const check = (resource, action) => {
    if (isGroupOwnerOrAdmin) return true
    const list = effectivePermissions?.[resource] || []
    if (Array.isArray(list) && list.includes(action)) return true
    return action === 'READ'
  }

  return {
    isAdmin: isGroupOwnerOrAdmin,
    isSystemAdmin,
    groupRole,
    activeGroup,
    match: {
      canCreate: check('MATCH', 'CREATE'),
      canEdit: check('MATCH', 'EDIT'),
      canDelete: check('MATCH', 'DELETE'),
      canRead: check('MATCH', 'READ'),
    },
    boardGame: {
      canCreate: check('BOARDGAME', 'CREATE'),
      canEdit: check('BOARDGAME', 'EDIT'),
      canDelete: check('BOARDGAME', 'DELETE'),
      canRead: check('BOARDGAME', 'READ'),
    },
    user: {
      canCreate: check('USER', 'CREATE'),
      canEdit: check('USER', 'EDIT'),
      canDelete: check('USER', 'DELETE'),
      canRead: check('USER', 'READ'),
    },
    hasPermission: check,
  }
}
