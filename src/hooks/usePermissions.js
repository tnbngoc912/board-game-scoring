import { useAuthStore } from '../store/authStore'

export function usePermissions() {
  const currentUser = useAuthStore((state) => state.user)
  const isAdmin = currentUser?.role === 'ADMIN'
  const matchPermissions = currentUser?.permissions?.MATCH || []

  return {
    isAdmin,
    match: {
      canCreate: isAdmin || matchPermissions.includes('CREATE'),
      canEdit: isAdmin || matchPermissions.includes('EDIT'),
      canDelete: isAdmin || matchPermissions.includes('DELETE'),
      canRead: isAdmin || matchPermissions.includes('READ'),
    },
    hasPermission: (resource, action) => {
      if (isAdmin) return true
      const resourcePermissions = currentUser?.permissions?.[resource] || []
      return resourcePermissions.includes(action)
    }
  }
}
