import { normalizeAuthUser, normalizeUser } from '../store/mappers/authMapper'
import { normalizeBoardGame, normalizeBoardGameOverview } from '../store/mappers/boardGameMapper'
import { getEntityId, unwrapEntity, unwrapList } from '../store/mappers/entityMapper'
import { normalizeMatch, normalizeMatchDetail } from '../store/mappers/matchMapper'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `https://boardgame-scorer-backend.onrender.com/api/v1`
const AUTH_TOKEN_KEY = 'scorekeeper_auth_token'
let authToken = null

function readStoredToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

function getAuthToken() {
  if (authToken) return authToken
  authToken = readStoredToken()
  return authToken
}

export function setAuthToken(token) {
  authToken = token || null
  if (typeof window === 'undefined') return
  if (authToken) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, authToken)
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

export function clearAuthToken() {
  setAuthToken(null)
}

async function request(path, options = {}) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `API request failed: ${response.status}`)
  }

  return payload?.data || payload
}

async function requestFormData(path, formData, options = {}) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method: options.method || 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: formData,
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `API request failed: ${response.status}`)
  }

  return payload?.data || payload
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function emailForPlayer(name) {
  return `${slugify(name) || 'player'}@scorekeeper.local`
}

export async function syncUserByName(name) {
  const payload = await request('/users/sync', {
    method: 'POST',
    body: JSON.stringify({
      email: emailForPlayer(name),
      name,
      avatar_drive_id: '',
    }),
  })
  const user = unwrapEntity(payload, ['user'])

  return {
    ...user,
    id: getEntityId(user),
  }
}

export async function login({ email, password }) {
  const payload = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const token = payload?.token || ''
  const user = normalizeAuthUser(payload?.user || {})
  return { token, user }
}

export async function forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function getMyProfile() {
  const payload = await request('/users/me')
  return normalizeAuthUser(payload || {})
}

export async function getUserGameStats(userId, params = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  const query = searchParams.toString()
  return request(`/users/${userId}/game-stats${query ? `?${query}` : ''}`)
}

export async function changePassword({ oldPassword, newPassword }) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  })
}

export async function getUsers(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.search) searchParams.set('search', params.search)

  const query = searchParams.toString()
  const payload = await request(`/users${query ? `?${query}` : ''}`)
  return unwrapList(payload).map(normalizeUser)
}

export async function getBoardGames() {
  const payload = await request('/board-games')
  return unwrapList(payload).map(normalizeBoardGame)
}

export async function getBoardGameOverview(boardGameId, { leaderboardLimit } = {}) {
  const searchParams = new URLSearchParams()
  if (leaderboardLimit) searchParams.set('leaderboardLimit', String(leaderboardLimit))
  const query = searchParams.toString()
  const payload = await request(`/board-games/${boardGameId}/overview${query ? `?${query}` : ''}`)
  return normalizeBoardGameOverview(payload, boardGameId)
}

export async function getMatches(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.boardGameId) searchParams.set('board_game_id', params.boardGameId)
  if (params.search) searchParams.set('search', params.search)

  const query = searchParams.toString()
  const payload = await request(`/matches${query ? `?${query}` : ''}`)
  return unwrapList(payload).map(normalizeMatch)
}

export async function ensureBoardGame(gameName, categories) {
  const boardGames = await getBoardGames()
  const existing = boardGames.find((game) => game.name === gameName)

  if (existing) {
    return normalizeBoardGame(existing)
  }

  const numericCategories = categories.filter((category) => category.type !== 'text')
  const payload = await request('/board-games', {
    method: 'POST',
    body: JSON.stringify({
      name: gameName,
      min_players: 1,
      max_players: 12,
      score_columns: numericCategories.map((category) => ({
        id: category.id,
        name: category.name,
        weight: 1,
      })),
    }),
  })
  const created = unwrapEntity(payload, ['board_game', 'boardGame', 'game'])

  return normalizeBoardGame(created)
}

export async function createMatch(boardGameId, playerIds) {
  const payload = await request('/matches', {
    method: 'POST',
    body: JSON.stringify({
      board_game_id: boardGameId,
      player_ids: playerIds,
    }),
  })
  const match = unwrapEntity(payload, ['match'])

  return {
    ...match,
    id: getEntityId(match),
  }
}

export async function getMatch(matchId) {
  const payload = await request(`/matches/${matchId}`)
  return normalizeMatchDetail(payload)
}

export async function updateMatchScores(matchId, { description, playerScores, winnerIds, imageAttachments }) {
  const body = {
    description,
  }

  if (winnerIds) {
    body.winner_ids = winnerIds
  } else {
    body.player_scores = playerScores
  }

  if (Array.isArray(imageAttachments)) {
    body.image_attachments = imageAttachments
  }

  return request(`/matches/${matchId}/scores`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function uploadMatchImages(files = []) {
  if (files.length === 0) return []

  return Promise.all(files.map(async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const payload = await requestFormData('/upload', formData)

    return {
      fileId: payload?.fileId,
      url: payload?.url,
      fileName: payload?.fileName || file.name,
    }
  }))
}

export async function deleteMatch(matchId) {
  return request(`/matches/${matchId}`, {
    method: 'DELETE',
  })
}

export function getId(entity) {
  return getEntityId(entity)
}
