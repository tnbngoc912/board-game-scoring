import { create } from 'zustand'
import { getBoardGames, getMatches, getUsers, getUserGameStats } from '../api/backendService'

const BOARD_GAMES_TTL = 5 * 60 * 1000
const USERS_TTL = 5 * 60 * 1000
const HISTORY_TTL = 30 * 1000
const USER_GAME_STATS_TTL = 5 * 60 * 1000

let boardGamesRequest = null
let usersRequest = null
let historyRequest = null
let userGameStatsRequest = null

function isFresh(fetchedAt, ttl) {
  return fetchedAt > 0 && Date.now() - fetchedAt < ttl
}

export const useAppDataStore = create((set, get) => ({
  boardGames: [],
  boardGamesPage: 1,
  boardGamesTotalPages: 1,
  boardGamesTotalResults: 0,
  boardGamesHasMore: false,
  boardGamesFetchedAt: 0,
  isLoadingBoardGames: false,
  isLoadingMoreBoardGames: false,
  users: [],
  usersFetchedAt: 0,
  isLoadingUsers: false,
  history: [],
  historyPage: 1,
  historyTotalPages: 1,
  historyTotalResults: 0,
  historyHasMore: false,
  historyFetchedAt: 0,
  isLoadingHistory: false,
  isLoadingMoreHistory: false,
  userGameStats: [],
  userGameStatsFetchedAt: 0,
  isLoadingUserGameStats: false,
  activeMatchDetail: null,
  cachedMatchDetails: {},

  setActiveMatchDetail(match) {
    if (!match) {
      set({ activeMatchDetail: null })
      return
    }
    const id = String(match.id || '')
    set((state) => ({
      activeMatchDetail: match,
      cachedMatchDetails: id ? { ...state.cachedMatchDetails, [id]: match } : state.cachedMatchDetails,
    }))
  },

  async fetchBoardGames({ force = false, page = 1, limit = 10, ...params } = {}) {
    const { boardGames, boardGamesFetchedAt } = get()
    if (!force && page === 1 && isFresh(boardGamesFetchedAt, BOARD_GAMES_TTL) && boardGames.length > 0) return boardGames
    if (boardGamesRequest) return boardGamesRequest

    set({ isLoadingBoardGames: true })
    boardGamesRequest = getBoardGames({ page, limit, ...params })
      .then((res) => {
        const items = res?.items || (Array.isArray(res) ? res : [])
        const totalPages = res?.totalPages || 1
        const totalResults = res?.totalResults || items.length
        const hasMore = page < totalPages

        set({
          boardGames: items,
          boardGamesPage: page,
          boardGamesTotalPages: totalPages,
          boardGamesTotalResults: totalResults,
          boardGamesHasMore: hasMore,
          boardGamesFetchedAt: Date.now(),
          isLoadingBoardGames: false,
        })
        return items
      })
      .catch((error) => {
        set({ isLoadingBoardGames: false })
        throw error
      })
      .finally(() => {
        boardGamesRequest = null
      })

    return boardGamesRequest
  },

  async fetchMoreBoardGames({ limit = 10, ...params } = {}) {
    const { boardGames, boardGamesPage, boardGamesHasMore, isLoadingMoreBoardGames, isLoadingBoardGames } = get()
    if (!boardGamesHasMore || isLoadingMoreBoardGames || isLoadingBoardGames) return boardGames

    const nextPage = boardGamesPage + 1
    set({ isLoadingMoreBoardGames: true })

    try {
      const res = await getBoardGames({ page: nextPage, limit, ...params })
      const newItems = res?.items || (Array.isArray(res) ? res : [])
      const totalPages = res?.totalPages || 1
      const totalResults = res?.totalResults || (boardGames.length + newItems.length)
      const hasMore = nextPage < totalPages

      const existingIds = new Set(boardGames.map((item) => item.id || item._id))
      const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id || item._id))
      const updatedGames = [...boardGames, ...uniqueNewItems]

      set({
        boardGames: updatedGames,
        boardGamesPage: nextPage,
        boardGamesTotalPages: totalPages,
        boardGamesTotalResults: totalResults,
        boardGamesHasMore: hasMore,
        isLoadingMoreBoardGames: false,
      })
      return updatedGames
    } catch (error) {
      set({ isLoadingMoreBoardGames: false })
      throw error
    }
  },

  async fetchUsers({ force = false } = {}) {
    const { users, usersFetchedAt } = get()
    if (!force && isFresh(usersFetchedAt, USERS_TTL)) return users
    if (usersRequest) return usersRequest

    set({ isLoadingUsers: true })
    usersRequest = getUsers()
      .then((items) => {
        set({
          users: items,
          usersFetchedAt: Date.now(),
          isLoadingUsers: false,
        })
        return items
      })
      .catch((error) => {
        set({ isLoadingUsers: false })
        throw error
      })
      .finally(() => {
        usersRequest = null
      })

    return usersRequest
  },

  async fetchHistory({ force = false, page = 1, limit = 10 } = {}) {
    const { history, historyFetchedAt } = get()
    if (!force && page === 1 && isFresh(historyFetchedAt, HISTORY_TTL) && history.length > 0) return history
    if (historyRequest) return historyRequest

    set({ isLoadingHistory: true })
    historyRequest = getMatches({ page, limit })
      .then((res) => {
        const items = res?.items || (Array.isArray(res) ? res : [])
        const totalPages = res?.totalPages || 1
        const totalResults = res?.totalResults || items.length
        const hasMore = page < totalPages

        set({
          history: items,
          historyPage: page,
          historyTotalPages: totalPages,
          historyTotalResults: totalResults,
          historyHasMore: hasMore,
          historyFetchedAt: Date.now(),
          isLoadingHistory: false,
        })
        return items
      })
      .catch((error) => {
        set({ isLoadingHistory: false })
        throw error
      })
      .finally(() => {
        historyRequest = null
      })

    return historyRequest
  },

  async fetchMoreHistory({ limit = 10 } = {}) {
    const { history, historyPage, historyHasMore, isLoadingMoreHistory, isLoadingHistory } = get()
    if (!historyHasMore || isLoadingMoreHistory || isLoadingHistory) return history

    const nextPage = historyPage + 1
    set({ isLoadingMoreHistory: true })

    try {
      const res = await getMatches({ page: nextPage, limit })
      const newItems = res?.items || (Array.isArray(res) ? res : [])
      const totalPages = res?.totalPages || 1
      const totalResults = res?.totalResults || (history.length + newItems.length)
      const hasMore = nextPage < totalPages

      const existingIds = new Set(history.map((item) => item.id))
      const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id))
      const updatedHistory = [...history, ...uniqueNewItems]

      set({
        history: updatedHistory,
        historyPage: nextPage,
        historyTotalPages: totalPages,
        historyTotalResults: totalResults,
        historyHasMore: hasMore,
        isLoadingMoreHistory: false,
      })
      return updatedHistory
    } catch (error) {
      set({ isLoadingMoreHistory: false })
      throw error
    }
  },

  invalidateBoardGames() {
    set({ boardGamesFetchedAt: 0 })
  },

  invalidateUsers() {
    set({ usersFetchedAt: 0 })
  },

  invalidateHistory() {
    set({ historyFetchedAt: 0 })
  },

  async fetchUserGameStats(userId, { force = false } = {}) {
    if (!userId) return []
    const { userGameStats, userGameStatsFetchedAt } = get()
    if (!force && isFresh(userGameStatsFetchedAt, USER_GAME_STATS_TTL)) return userGameStats
    if (userGameStatsRequest) return userGameStatsRequest

    set({ isLoadingUserGameStats: true })
    userGameStatsRequest = getUserGameStats(userId)
      .then((res) => {
        const items = res?.results || res || []
        set({
          userGameStats: items,
          userGameStatsFetchedAt: Date.now(),
          isLoadingUserGameStats: false,
        })
        return items
      })
      .catch((error) => {
        set({ isLoadingUserGameStats: false })
        throw error
      })
      .finally(() => {
        userGameStatsRequest = null
      })

    return userGameStatsRequest
  },

  invalidateUserGameStats() {
    set({ userGameStatsFetchedAt: 0 })
  },

  removeHistoryMatch(matchId) {
    set((state) => ({
      history: state.history.filter((entry) => entry.id !== matchId),
    }))
  },
}))
