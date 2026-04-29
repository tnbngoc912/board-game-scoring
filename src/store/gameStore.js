import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  createRoomDocument,
  getRoom,
  publishScores as publishScoresToRoom,
  subscribeToRoom,
  updateBoard,
} from '../firebase/firestoreService'

const PLAYER_COLORS = ['#ea6556', '#5a98e6', '#6fbe78', '#e3af47', '#b57be7', '#ef8e45']
const DEFAULT_CATEGORIES = [
  'Diem tai nguyen',
  'Diem muc tieu',
  'Diem bonus',
  'Diem cuoi game',
]
const PUBLIC_ROOM_ID = 'PUBLIC'

function pickColor(index) { return PLAYER_COLORS[index % PLAYER_COLORS.length] }
function initials(name) { return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) }
function normalizeLabel(value) { return value.trim() }

let roomUnsubscribe = null

function stopRoomSync() {
  roomUnsubscribe?.()
  roomUnsubscribe = null
}

function ensureScoreRows(categories, players, publishedScores = []) {
  const scoreMap = new Map(publishedScores.map((entry) => [entry.id, entry]))

  return categories.map((category) => {
    const previous = scoreMap.get(category.id)
    const scores = {}

    players.forEach((player) => {
      scores[player.id] = previous?.scores?.[player.id] ?? 0
    })

    return {
      id: category.id,
      name: category.name,
      scores,
    }
  })
}

function calculateTotals(players, publishedScores) {
  return [...players]
    .map((player) => ({
      ...player,
      total: publishedScores.reduce((sum, row) => sum + (row.scores?.[player.id] ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      gameName: '',
      players: [],
      categories: [],
      publishedScores: [],
      history: [],
      darkMode: false,
      uid: null,
      syncStatus: 'idle',

      getTotals() {
        return calculateTotals(get().players, get().publishedScores)
      },

      setUser(firebaseUser) {
        const uid = firebaseUser?.uid ?? null
        set({ uid })

        if (uid) {
          get().initializePublicBoard().catch(() => set({ syncStatus: 'offline' }))
        }
      },

      async initializePublicBoard() {
        const uid = get().uid
        if (!uid) return false

        const existing = await getRoom(PUBLIC_ROOM_ID)
        if (!existing) {
          await createRoomDocument(PUBLIC_ROOM_ID, uid)
          await updateBoard(PUBLIC_ROOM_ID, {
            categories: DEFAULT_CATEGORIES.map((name) => ({ id: crypto.randomUUID(), name })),
          })
        }

        get()._attachRoom()
        return true
      },

      setGameName(name) {
        const gameName = name
        set({ gameName })
        get()._syncBoard({ gameName })
      },

      selectGame(game) {
        if (!game) {
          const nextScores = ensureScoreRows([], get().players, [])
          set({ gameName: '', categories: [], publishedScores: nextScores })
          get()._syncBoard({ gameName: '', categories: [], publishedScores: nextScores })
          return
        }

        const gameName = game.name
        const categories = game.categories.map((name) => ({
          id: crypto.randomUUID(),
          name,
        }))
        const publishedScores = ensureScoreRows(categories, get().players, [])

        set({ gameName, categories, publishedScores })
        get()._syncBoard({ gameName, categories, publishedScores })
      },

      addPlayer(name) {
        const trimmed = normalizeLabel(name)
        if (!trimmed) return false

        const nextPlayers = [
          ...get().players,
          {
            id: crypto.randomUUID(),
            name: trimmed,
            initials: initials(trimmed),
            color: pickColor(get().players.length),
          },
        ]

        const nextScores = ensureScoreRows(get().categories, nextPlayers, get().publishedScores)
        set({ players: nextPlayers, publishedScores: nextScores })
        get()._syncBoard({ players: nextPlayers, publishedScores: nextScores })
        return true
      },

      removePlayer(id) {
        const nextPlayers = get().players.filter((player) => player.id !== id)
        const nextScores = ensureScoreRows(get().categories, nextPlayers, get().publishedScores)
        set({ players: nextPlayers, publishedScores: nextScores })
        get()._syncBoard({ players: nextPlayers, publishedScores: nextScores })
      },

      addCategory(name) {
        const trimmed = normalizeLabel(name)
        if (!trimmed) return false

        const nextCategories = [...get().categories, { id: crypto.randomUUID(), name: trimmed }]
        const nextScores = ensureScoreRows(nextCategories, get().players, get().publishedScores)
        set({ categories: nextCategories, publishedScores: nextScores })
        get()._syncBoard({ categories: nextCategories, publishedScores: nextScores })
        return true
      },

      removeCategory(id) {
        const nextCategories = get().categories.filter((category) => category.id !== id)
        const nextScores = ensureScoreRows(nextCategories, get().players, get().publishedScores)
        set({ categories: nextCategories, publishedScores: nextScores })
        get()._syncBoard({ categories: nextCategories, publishedScores: nextScores })
      },

      async publishScores(scoreRows) {
        const { gameName, players, categories } = get()
        const publishedScores = ensureScoreRows(categories, players, scoreRows)
        const totals = calculateTotals(players, publishedScores)
        const winner = totals[0] ?? null

        const historyEntry = {
          id: crypto.randomUUID(),
          gameName: gameName || 'Khong ten',
          playedAt: new Date().toLocaleString('vi-VN'),
          playerCount: players.length,
          winner: winner ? { id: winner.id, name: winner.name, total: winner.total } : null,
          players: totals.map((player) => ({
            id: player.id,
            name: player.name,
            color: player.color,
            total: player.total,
          })),
        }

        set({ syncStatus: 'syncing' })
        try {
          await publishScoresToRoom(PUBLIC_ROOM_ID, {
            gameName,
            players,
            categories,
            publishedScores,
            historyEntry,
          })
          set({ syncStatus: 'synced' })
          return true
        } catch {
          set({ syncStatus: 'offline' })
          return false
        }
      },

      async resetBoard() {
        const categories = DEFAULT_CATEGORIES.map((name) => ({ id: crypto.randomUUID(), name }))
        set({ syncStatus: 'syncing' })
        try {
          await updateBoard(PUBLIC_ROOM_ID, {
            gameName: '',
            players: [],
            categories,
            publishedScores: [],
          })
          set({ syncStatus: 'synced' })
          return true
        } catch {
          set({ syncStatus: 'offline' })
          return false
        }
      },

      toggleDarkMode() {
        set((state) => ({ darkMode: !state.darkMode }))
      },

      _attachRoom() {
        stopRoomSync()
        set({ syncStatus: 'syncing' })

        roomUnsubscribe = subscribeToRoom(PUBLIC_ROOM_ID, (room) => {
          if (!room) {
            stopRoomSync()
            set({ syncStatus: 'idle' })
            return
          }

          const categories = Array.isArray(room.categories) && room.categories.length
            ? room.categories
            : DEFAULT_CATEGORIES.map((name) => ({ id: crypto.randomUUID(), name }))
          const players = room.players || []
          const publishedScores = ensureScoreRows(categories, players, room.publishedScores || [])

          set({
            gameName: room.gameName || '',
            players,
            categories,
            publishedScores,
            history: room.history || [],
            syncStatus: 'synced',
          })
        })
      },

      _syncBoard(payload) {
        set({ syncStatus: 'syncing' })
        updateBoard(PUBLIC_ROOM_ID, payload)
          .then(() => set({ syncStatus: 'synced' }))
          .catch(() => set({ syncStatus: 'offline' }))
      },
    }),
    {
      name: 'scorekeeper-v4',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        darkMode: state.darkMode,
      }),
    }
  )
)
