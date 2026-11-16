import { create } from 'zustand'
import {
  clearActiveGroupId,
  createGroup as createGroupApi,
  getActiveGroupId,
  getMyGroups,
  joinGroupByInviteCode as joinGroupApi,
  setActiveGroupId,
} from '../api/backendService'
import { useAppDataStore } from './appDataStore'

function normalizeGroupItem(g) {
  if (!g) return null
  return {
    ...g,
    id: String(g._id || g.id || ''),
    _id: String(g._id || g.id || ''),
    my_role: g.my_role || 'MEMBER',
    my_status: g.my_status || 'ACTIVE',
    my_permissions: g.my_permissions || {
      MATCH: ['READ'],
      BOARDGAME: ['READ'],
      USER: ['READ'],
      CATEGORY: ['READ'],
    },
  }
}

export const useGroupStore = create((set, get) => ({
  groups: [],
  activeGroupId: '',
  isLoadingGroups: false,
  hasLoadedGroups: false,

  async fetchMyGroups({ force = false } = {}) {
    const { hasLoadedGroups, isLoadingGroups, groups } = get()
    if (!force && hasLoadedGroups && !isLoadingGroups) {
      return groups
    }

    set({ isLoadingGroups: true })
    try {
      const rawGroups = await getMyGroups()
      const normalized = (rawGroups || []).map(normalizeGroupItem).filter(Boolean)
      const activeGroups = normalized.filter((g) => g.my_status === 'ACTIVE')

      const storedId = getActiveGroupId() || get().activeGroupId
      const matchedActive = activeGroups.find((g) => g.id === String(storedId))
      const resolvedActiveId = matchedActive ? matchedActive.id : activeGroups[0]?.id || ''

      if (resolvedActiveId) {
        setActiveGroupId(resolvedActiveId)
      } else {
        clearActiveGroupId()
      }

      set({
        groups: normalized,
        activeGroupId: resolvedActiveId,
        isLoadingGroups: false,
        hasLoadedGroups: true,
      })

      return normalized
    } catch (error) {
      set({ isLoadingGroups: false, hasLoadedGroups: true })
      throw error
    }
  },

  selectGroup(groupId) {
    const nextId = String(groupId || '')
    setActiveGroupId(nextId)
    set({ activeGroupId: nextId })
    useAppDataStore.getState().resetAllGroupData()
  },

  async createGroup({ name, description }) {
    const created = await createGroupApi({ name, description })
    const createdId = String(created?._id || created?.id || '')
    if (createdId) {
      setActiveGroupId(createdId)
      set({ activeGroupId: createdId })
    }
    await get().fetchMyGroups({ force: true })
    useAppDataStore.getState().resetAllGroupData()
    return created
  },

  async joinGroup(inviteCode) {
    const res = await joinGroupApi(inviteCode)
    const data = res?.data || res
    await get().fetchMyGroups({ force: true })
    return {
      ...data,
      message: res?.message || '',
    }
  },

  clearGroups() {
    clearActiveGroupId()
    set({
      groups: [],
      activeGroupId: '',
      isLoadingGroups: false,
      hasLoadedGroups: false,
    })
  },
}))
