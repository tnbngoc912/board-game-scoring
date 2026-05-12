import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  changePassword,
  clearAuthToken,
  forgotPassword,
  getMyProfile,
  login as loginApi,
  setAuthToken,
} from '../api/backendService'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: '',
      user: null,
      isAuthLoading: true,

      async bootstrap() {
        const { token, user } = get()
        if (!token) {
          set({ user: null, isAuthLoading: false })
          return
        }

        setAuthToken(token)
        if (user) {
          set({ isAuthLoading: false })
          return
        }

        try {
          const user = await getMyProfile()
          set({ user, isAuthLoading: false })
        } catch {
          clearAuthToken()
          set({ token: '', user: null, isAuthLoading: false })
        }
      },

      async login(email, password) {
        const { token, user } = await loginApi({ email, password })
        if (!token) throw new Error('Khong nhan duoc token')
        setAuthToken(token)
        set({ token, user })
        return user
      },

      async forgotPassword(email) {
        return forgotPassword(email)
      },

      async refreshProfile() {
        const user = await getMyProfile()
        set({ user })
        return user
      },

      async changePassword(oldPassword, newPassword) {
        return changePassword({ oldPassword, newPassword })
      },

      logout() {
        clearAuthToken()
        set({ token: '', user: null })
      },
    }),
    {
      name: 'scorekeeper-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
