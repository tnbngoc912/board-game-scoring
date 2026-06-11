import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useAppDataStore } from './appDataStore'
import {
  createMatch,
  ensureBoardGame,
  syncUserByName,
  updateMatchScores,
  uploadMatchImages,
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

function getWinnerIds(players, scoreRows) {
  const winnerRow = scoreRows.find((row) => row.id === 'winner')

  return players
    .filter((player) => winnerRow?.scores?.[player.id])
    .map((player) => player.apiUserId)
    .filter(Boolean)
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      gameName: '',
      boardGameId: '',
      gameFlow: 'overview',
      boardGameOverview: null,
      scoringType: 'COLUMN_BASED',
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
          set({
            gameName: '',
            boardGameId: '',
            gameFlow: 'overview',
            boardGameOverview: null,
            scoringType: 'COLUMN_BASED',
            categories: [],
            publishedScores: nextScores
          })
          return
        }

        const boardGameId = game.id || game._id || ''
        const gameName = game.name
        const scoringType = game.scoringType || game.scoring_type || 'COLUMN_BASED'
        const categories = game.categories.map((category, index) => ({
          id: getScoreColumnId(category, index),
          ...normalizeCategory(category),
        }))
        const publishedScores = ensureScoreRows(categories, get().players, [])

        set({
          boardGameId,
          gameName,
          gameFlow: 'overview',
          boardGameOverview: null,
          scoringType,
          categories,
          publishedScores
        })
      },

      setGameFlow(gameFlow) {
        set({ gameFlow })
      },

      applyBoardGameOverview(overview) {
        if (!overview) return
        const categories = (overview.categories || []).map((category, index) => ({
          id: getScoreColumnId(category, index),
          ...normalizeCategory(category),
        }))
        const nextScores = ensureScoreRows(categories, get().players, get().publishedScores)
        set({
          boardGameId: overview.id || get().boardGameId,
          gameName: overview.name || get().gameName,
          boardGameOverview: overview,
          scoringType: overview.scoringType || get().scoringType,
          categories,
          publishedScores: nextScores,
        })
      },

      addPlayer(name, apiUserId = null, avatar) {
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
            avatar_url: avatar
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

      clearPlayers() {
        set({
          players: [],
          publishedScores: ensureScoreRows(get().categories, [], []),
        })
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

      async publishScores(scoreRows, description = '', memoryImageFiles = []) {
        const { gameName, scoringType, players, categories } = get()
        const publishedScores = scoringType === 'WINNER_ONLY'
          ? scoreRows
          : ensureScoreRows(categories, players, scoreRows)

        set({ syncStatus: 'syncing' })
        try {
          const syncedUsers = await Promise.all(players.map(async (player) => {
            if (player.apiUserId) return { id: player.apiUserId, name: player.name }
            return syncUserByName(player.name)
          }))
          const boardGame = await ensureBoardGame(gameName || 'Khong ten', categories)
          const match = await createMatch(boardGame.id, syncedUsers.map((user) => user.id))

          const playersWithApiIds = players.map((player, index) => ({
            ...player,
            apiUserId: syncedUsers[index].id,
          }))
          const playerScores = scoringType === 'WINNER_ONLY'
            ? null
            : syncedUsers.map((user, index) => {
              const player = players[index]

              return {
                user_id: user.id,
                scores: buildApiScoresForPlayer(player.id, publishedScores),
              }
            })
          const winnerIds = getWinnerIds(playersWithApiIds, publishedScores)
          const imageAttachments = memoryImageFiles.length > 0
            ? await uploadMatchImages(memoryImageFiles)
            : []

          await updateMatchScores(match.id, {
            description: description.trim() || '',
            ...(scoringType === 'WINNER_ONLY' ? { winnerIds } : { playerScores }),
            imageAttachments,
          })

          set({
            publishedScores,
          })
          useAppDataStore.getState().invalidateHistory()
          useAppDataStore.getState().invalidateBoardGames()
          useAppDataStore.getState().invalidateUsers()
          useAppDataStore.getState().invalidateUserGameStats()
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
          boardGameId: '',
          gameFlow: 'overview',
          boardGameOverview: null,
          scoringType: 'COLUMN_BASED',
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
