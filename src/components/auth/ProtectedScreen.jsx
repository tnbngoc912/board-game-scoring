import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '../../store/authStore'
import { useGroupStore } from '../../store/groupStore'
import { LoadingState } from '../ui/LoadingState'
import { GroupOnboardingView } from '../group/GroupOnboardingView'
import { Toast } from '../Toast'
import { useToast } from '../../hooks/useToast'

export function ProtectedScreen({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { message, visible, show: showToast } = useToast()

  const { token, user, isAuthLoading, bootstrap } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
      user: state.user,
      isAuthLoading: state.isAuthLoading,
      bootstrap: state.bootstrap,
    }))
  )

  const { groups, isLoadingGroups, hasLoadedGroups, fetchMyGroups } = useGroupStore(
    useShallow((state) => ({
      groups: state.groups,
      isLoadingGroups: state.isLoadingGroups,
      hasLoadedGroups: state.hasLoadedGroups,
      fetchMyGroups: state.fetchMyGroups,
    }))
  )

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (isAuthLoading) return
    if (!token || !user) {
      let currentPath = pathname
      if (typeof window !== 'undefined') {
        const query = window.location.search
        if (query) {
          currentPath += query
        }
      }
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    fetchMyGroups().catch(() => {})
  }, [isAuthLoading, token, user, router, pathname, fetchMyGroups])

  if (isAuthLoading) return <LoadingState label="Đang tải..." />
  if (!token || !user) return <LoadingState label="Đang chuyển hướng..." />
  if (!hasLoadedGroups && isLoadingGroups) return <LoadingState label="Đang tải nhóm..." />

  const activeGroups = (groups || []).filter((g) => (g.my_status || 'ACTIVE') === 'ACTIVE')

  if (hasLoadedGroups && activeGroups.length === 0) {
    return (
      <div className="app-shell screen-setup">
        <GroupOnboardingView toast={showToast} />
        <Toast message={message} visible={visible} />
      </div>
    )
  }

  return children
}
