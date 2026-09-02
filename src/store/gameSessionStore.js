import { create } from 'zustand'

export const useGameSessionStore = create((set, get) => ({
  flow: 'overview',
  boardGameId: '',
  overviewByGameId: {},

  startGameFlow(boardGame) {
    const boardGameId = boardGame?.id || boardGame?._id || ''
    set({
      boardGameId,
      flow: 'overview',
    })
  },

  goToOverview() {
    set({ flow: 'overview' })
  },

  goToSetup() {
    set({ flow: 'setup' })
  },

  goToEntry() {
    set({ flow: 'entry' })
  },

  setOverview(boardGameId, overview) {
    if (!boardGameId || !overview) return
    set((state) => ({
      overviewByGameId: {
        ...state.overviewByGameId,
        [boardGameId]: overview,
      },
    }))
  },

  hydrateOverviewIfNeeded(boardGameId) {
    if (!boardGameId) return null
    return get().overviewByGameId[boardGameId] || null
  },

  resetSession() {
    set({
      flow: 'overview',
      boardGameId: '',
    })
  },
}))
