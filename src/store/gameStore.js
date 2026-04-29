import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  createMatch,
  ensureBoardGame,
  syncUserByName,
  updateMatchScores,
} from '../api/backendService'

const PLAYER_COLORS = ['#ea6556', '#5a98e6', '#6fbe78', '#e3af47', '#b57be7', '#ef8e45']
const DEFAULT_CATEGORIES = [
  'Diem tai nguyen',
  'Diem muc tieu',
  'Diem bonus',
  'Diem cuoi game',
]

function pickColor(index) { return PLAYER_COLORS[index % PLAYER_COLORS.length] }
function initials(name) { return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) }
function normalizeLabel(value) { return value.trim() }

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeCategory(category) {
  if (typeof category === 'string') {
    return { name: category, type: 'number' }
  }

  return {
    name: category.name,
    type: category.type === 'text' ? 'text' : 'number',
  }
}

function defaultScoreValue(category) {
  return category.type === 'text' ? '' : 0
}

function getScoreColumnId(category, index = 0) {
  return category.id || slugify(category.name) || `score-${index + 1}`
}

function ensureScoreRows(categories, players, publishedScores = []) {
  const scoreMap = new Map(publishedScores.map((entry) => [entry.id, entry]))

  return categories.map((category, index) => {
    const normalizedCategory = normalizeCategory(category)
    const id = getScoreColumnId(category, index)
    const previous = scoreMap.get(id)
    const scores = {}

    players.forEach((player) => {
      scores[player.id] = previous?.scores?.[player.id] ?? defaultScoreValue(normalizedCategory)
    })

    return {
      id,
      name: normalizedCategory.name,
      type: normalizedCategory.type,
      scores,
    }
  })
}

function calculateTotals(players, publishedScores) {
  return [...players]
    .map((player) => ({
      ...player,
      total: publishedScores.reduce((sum, row) => {
        if (row.type === 'text') return sum

        const score = Number(row.scores?.[player.id] ?? 0)
        return sum + (Number.isNaN(score) ? 0 : score)
      }, 0),
    }))
    .sort((a, b) => b.total - a.total)
}

function buildApiScoresForPlayer(playerId, scoreRows) {
  return scoreRows.reduce((scores, row) => {
    if (row.type === 'text') return scores

    const score = Number(row.scores?.[playerId] ?? 0)
    scores[row.id] = Number.isNaN(score) ? 0 : score
    return scores
  }, {})
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      gameName: '',
      players: [],
      categories: [],
      publishedScores: [],
      darkMode: false,
      syncStatus: 'idle',

      getTotals() {
        return calculateTotals(get().players, get().publishedScores)
      },

      setGameName(name) {
        const gameName = name
        set({ gameName })
      },

      selectGame(game) {
        if (!game) {
          const nextScores = ensureScoreRows([], get().players, [])
          set({ gameName: '', categories: [], publishedScores: nextScores })
          return
        }

        const gameName = game.name
        const categories = game.categories.map((category, index) => ({
          id: getScoreColumnId(category, index),
          ...normalizeCategory(category),
        }))
        const publishedScores = ensureScoreRows(categories, get().players, [])

        set({ gameName, categories, publishedScores })
      },

      addPlayer(name, apiUserId = null) {
        const trimmed = normalizeLabel(name)
        if (!trimmed) return false

        const nextPlayers = [
          ...get().players,
          {
            id: crypto.randomUUID(),
            apiUserId,
            name: trimmed,
            initials: initials(trimmed),
            color: pickColor(get().players.length),
          },
        ]

        const nextScores = ensureScoreRows(get().categories, nextPlayers, get().publishedScores)
        set({ players: nextPlayers, publishedScores: nextScores })
        return true
      },

      removePlayer(id) {
        const nextPlayers = get().players.filter((player) => player.id !== id)
        const nextScores = ensureScoreRows(get().categories, nextPlayers, get().publishedScores)
        set({ players: nextPlayers, publishedScores: nextScores })
      },

      updatePlayerName(id, name, apiUserId = null) {
        const trimmed = normalizeLabel(name)

        const nextPlayers = get().players.map((player) => (
          player.id === id
            ? { ...player, apiUserId, name: trimmed, initials: trimmed ? initials(trimmed) : '' }
            : player
        ))

        set({ players: nextPlayers })
        return true
      },

      addCategory(name) {
        const trimmed = normalizeLabel(name)
        if (!trimmed) return false

        const nextCategories = [...get().categories, { id: crypto.randomUUID(), name: trimmed, type: 'number' }]
        const nextScores = ensureScoreRows(nextCategories, get().players, get().publishedScores)
        set({ categories: nextCategories, publishedScores: nextScores })
        return true
      },

      removeCategory(id) {
        const nextCategories = get().categories.filter((category) => category.id !== id)
        const nextScores = ensureScoreRows(nextCategories, get().players, get().publishedScores)
        set({ categories: nextCategories, publishedScores: nextScores })
      },

      async publishScores(scoreRows) {
        const { gameName, players, categories } = get()
        const publishedScores = ensureScoreRows(categories, players, scoreRows)

        set({ syncStatus: 'syncing' })
        try {
          const syncedUsers = await Promise.all(players.map(async (player) => {
            if (player.apiUserId) return { id: player.apiUserId, name: player.name }
            return syncUserByName(player.name)
          }))
          const boardGame = await ensureBoardGame(gameName || 'Khong ten', categories)
          const match = await createMatch(boardGame.id, syncedUsers.map((user) => user.id))

          const playerScores = syncedUsers.map((user, index) => {
            const player = players[index]

            return {
              user_id: user.id,
              scores: buildApiScoresForPlayer(player.id, publishedScores),
            }
          })

          await updateMatchScores(match.id, {
            description: `${gameName || 'Van choi'} - ${new Date().toLocaleString('vi-VN')}`,
            playerScores,
          })

          set({
            publishedScores,
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
        set({
          gameName: '',
          players: [],
          categories,
          publishedScores: [],
          syncStatus: 'idle',
        })
        return true
      },

      toggleDarkMode() {
        set((state) => ({ darkMode: !state.darkMode }))
      },

    }),
    {
      name: 'scorekeeper-v4',
      storage: createJSONStorage(() => localStorage),
      version: 5,
      migrate: (persistedState) => ({
        darkMode: persistedState?.darkMode ?? false,
      }),
      partialize: (state) => ({
        darkMode: state.darkMode,
      }),
    }
  )
)
