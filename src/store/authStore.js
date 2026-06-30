import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  changePassword,
  clearAuthToken,
  forgotPassword,
  getMyProfile,
  login as loginApi,
  registerTokenExpiredListener,
  setAuthToken,
} from '../api/backendService'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: '',
      user: null,
      isAuthLoading: true,
      hasBootstrapped: false,

      async bootstrap() {
        const { token, user, hasBootstrapped } = get()
        if (hasBootstrapped) {
          set({ isAuthLoading: false })
          return
        }

        if (!token) {
          set({ user: null, isAuthLoading: false, hasBootstrapped: true })
          return
        }

        setAuthToken(token)
        if (user) {
          set({ isAuthLoading: false, hasBootstrapped: true })
          return
        }

        try {
          const user = await getMyProfile()
          set({ user, isAuthLoading: false, hasBootstrapped: true })
        } catch {
          clearAuthToken()
          set({ token: '', user: null, isAuthLoading: false, hasBootstrapped: true })
        }
      },

      async login(email, password) {
        const { token } = await loginApi({ email, password })
        if (!token) throw new Error('Khong nhan duoc token')
        setAuthToken(token)
        try {
          const user = await getMyProfile()
          set({ token, user })
          return user
        } catch (error) {
          clearAuthToken()
          throw new Error(error?.message || 'Không thể tải thông tin tài khoản')
        }
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
        set({ token: '', user: null, hasBootstrapped: true })
      },
    }),
    {
      name: 'scorekeeper-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)

registerTokenExpiredListener(() => {
  useAuthStore.getState().logout()
})
