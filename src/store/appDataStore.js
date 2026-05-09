import { create } from 'zustand'
import { getBoardGames, getMatches, getUsers } from '../api/backendService'

const BOARD_GAMES_TTL = 5 * 60 * 1000
const USERS_TTL = 5 * 60 * 1000
const HISTORY_TTL = 30 * 1000

let boardGamesRequest = null
let usersRequest = null
let usersRequestKey = ''
let usersRequestId = 0
let historyRequest = null

function isFresh(fetchedAt, ttl) {
  return fetchedAt > 0 && Date.now() - fetchedAt < ttl
}

export const useAppDataStore = create((set, get) => ({
  boardGames: [],
  boardGamesFetchedAt: 0,
  isLoadingBoardGames: false,
  users: [],
  usersFetchedAt: 0,
  isLoadingUsers: false,
  history: [],
  historyFetchedAt: 0,
  isLoadingHistory: false,

  async fetchBoardGames({ force = false } = {}) {
    const { boardGames, boardGamesFetchedAt } = get()
    if (!force && isFresh(boardGamesFetchedAt, BOARD_GAMES_TTL)) return boardGames
    if (boardGamesRequest) return boardGamesRequest

    set({ isLoadingBoardGames: true })
    boardGamesRequest = getBoardGames()
      .then((items) => {
        set({
          boardGames: items,
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

  async fetchUsers({ force = false, search = '' } = {}) {
    const normalizedSearch = search.trim()
    const { users, usersFetchedAt } = get()
    if (!normalizedSearch && !force && isFresh(usersFetchedAt, USERS_TTL)) return users
    if (usersRequest && usersRequestKey === normalizedSearch) return usersRequest

    set({ isLoadingUsers: true })
    usersRequestKey = normalizedSearch
    const requestId = ++usersRequestId
    usersRequest = getUsers({ search: normalizedSearch })
      .then((items) => {
        if (requestId === usersRequestId) {
          set({
            users: items,
            usersFetchedAt: normalizedSearch ? 0 : Date.now(),
            isLoadingUsers: false,
          })
        }
        return items
      })
      .catch((error) => {
        if (requestId === usersRequestId) set({ isLoadingUsers: false })
        throw error
      })
      .finally(() => {
        if (requestId === usersRequestId) {
          usersRequest = null
          usersRequestKey = ''
        }
      })

    return usersRequest
  },

  async fetchHistory({ force = false } = {}) {
    const { history, historyFetchedAt } = get()
    if (!force && isFresh(historyFetchedAt, HISTORY_TTL)) return history
    if (historyRequest) return historyRequest

    set({ isLoadingHistory: true })
    historyRequest = getMatches()
      .then((items) => {
        set({
          history: items,
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

  invalidateBoardGames() {
    set({ boardGamesFetchedAt: 0 })
  },

  invalidateUsers() {
    set({ usersFetchedAt: 0 })
  },

  invalidateHistory() {
    set({ historyFetchedAt: 0 })
  },

  removeHistoryMatch(matchId) {
    set((state) => ({
      history: state.history.filter((entry) => entry.id !== matchId),
    }))
  },
}))
