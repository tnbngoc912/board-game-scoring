import { create } from 'zustand'
import { getBoardGames, getMatches, getUsers, getUserGameStats } from '../api/backendService'

const BOARD_GAMES_TTL = 5 * 60 * 1000
const USERS_TTL = 5 * 60 * 1000
const HISTORY_TTL = 30 * 1000
const USER_GAME_STATS_TTL = 5 * 60 * 1000

let allBoardGamesRequest = null
let boardGamesRequest = null
let usersRequest = null
let historyRequest = null
let userGameStatsRequest = null

function isFresh(fetchedAt, ttl) {
  return fetchedAt > 0 && Date.now() - fetchedAt < ttl
}

function getFilterKey(filters = {}) {
  return JSON.stringify(filters)
}

export const useAppDataStore = create((set, get) => ({
  allBoardGames: [],
  allBoardGamesFetchedAt: 0,
  isLoadingAllBoardGames: false,

  boardGames: [],
  boardGamesPage: 1,
  boardGamesTotalPages: 1,
  boardGamesTotalResults: 0,
  boardGamesHasMore: false,
  boardGamesFetchedAt: 0,
  boardGamesFilters: {},
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
  historyFilters: {},
  isLoadingHistory: false,
  isLoadingMoreHistory: false,

  userGameStats: [],
  userGameStatsFetchedAt: 0,
  isLoadingUserGameStats: false,

  async fetchAllBoardGames({ force = false } = {}) {
    const { allBoardGames, allBoardGamesFetchedAt } = get()
    if (!force && isFresh(allBoardGamesFetchedAt, BOARD_GAMES_TTL) && allBoardGames.length > 0) return allBoardGames
    if (allBoardGamesRequest) return allBoardGamesRequest

    set({ isLoadingAllBoardGames: true })
    allBoardGamesRequest = getBoardGames()
      .then((res) => {
        const items = res?.items || (Array.isArray(res) ? res : [])
        set({
          allBoardGames: items,
          allBoardGamesFetchedAt: Date.now(),
          isLoadingAllBoardGames: false,
        })
        return items
      })
      .catch((error) => {
        set({ isLoadingAllBoardGames: false })
        throw error
      })
      .finally(() => {
        allBoardGamesRequest = null
      })

    return allBoardGamesRequest
  },

  async fetchBoardGames({ force = false, page = 1, limit = 10, ...filters } = {}) {
    const { boardGames, boardGamesFetchedAt, boardGamesFilters } = get()
    const filterKeyChanged = getFilterKey(boardGamesFilters) !== getFilterKey(filters)

    if (!force && !filterKeyChanged && page === 1 && isFresh(boardGamesFetchedAt, BOARD_GAMES_TTL) && boardGames.length > 0) {
      return boardGames
    }

    if (boardGamesRequest && !filterKeyChanged) return boardGamesRequest

    set({ isLoadingBoardGames: true, boardGamesFilters: filters })
    boardGamesRequest = getBoardGames({ page, limit, ...filters })
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

  async fetchMoreBoardGames({ limit = 10, ...filters } = {}) {
    const { boardGames, boardGamesPage, boardGamesHasMore, isLoadingMoreBoardGames, isLoadingBoardGames, boardGamesFilters } = get()
    if (!boardGamesHasMore || isLoadingMoreBoardGames || isLoadingBoardGames) return boardGames

    const effectiveFilters = { ...boardGamesFilters, ...filters }
    const nextPage = boardGamesPage + 1
    set({ isLoadingMoreBoardGames: true })

    try {
      const res = await getBoardGames({ page: nextPage, limit, ...effectiveFilters })
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

  async fetchHistory({ force = false, page = 1, limit = 10, ...filters } = {}) {
    const { history, historyFetchedAt, historyFilters } = get()
    const filterKeyChanged = getFilterKey(historyFilters) !== getFilterKey(filters)

    if (!force && !filterKeyChanged && page === 1 && isFresh(historyFetchedAt, HISTORY_TTL) && history.length > 0) {
      return history
    }

    if (historyRequest && !filterKeyChanged) return historyRequest

    set({ isLoadingHistory: true, historyFilters: filters })
    historyRequest = getMatches({ page, limit, ...filters })
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

  async fetchMoreHistory({ limit = 10, ...filters } = {}) {
    const { history, historyPage, historyHasMore, isLoadingMoreHistory, isLoadingHistory, historyFilters } = get()
    if (!historyHasMore || isLoadingMoreHistory || isLoadingHistory) return history

    const effectiveFilters = { ...historyFilters, ...filters }
    const nextPage = historyPage + 1
    set({ isLoadingMoreHistory: true })

    try {
      const res = await getMatches({ page: nextPage, limit, ...effectiveFilters })
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
    set({ boardGamesFetchedAt: 0, allBoardGamesFetchedAt: 0 })
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
