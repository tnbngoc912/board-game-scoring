const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://boardgame-scorer-backend.onrender.com/api/v1'

function getEntityId(entity) {
  return entity?._id || entity?.id
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.board_games)) return payload.board_games
  if (Array.isArray(payload?.boardGames)) return payload.boardGames
  return []
}

function normalizeScoreColumn(column, index = 0) {
  return {
    id: column.id || column._id || `score-${index + 1}`,
    name: column.name,
    type: column.type === 'text' ? 'text' : 'number',
    weight: column.weight ?? 1,
  }
}

export function normalizeBoardGame(game) {
  const scoreColumns = game.score_columns || game.scoreColumns || game.categories || []

  return {
    ...game,
    id: getEntityId(game),
    categories: scoreColumns.map(normalizeScoreColumn),
  }
}

function unwrapEntity(payload, keys = []) {
  if (!payload) return payload

  for (const key of keys) {
    if (payload[key]) return payload[key]
  }

  return payload
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
      avatar_url: '',
    }),
  })
  const user = unwrapEntity(payload, ['user'])

  return {
    ...user,
    id: getEntityId(user),
  }
}

export async function getBoardGames() {
  const payload = await request('/board-games')
  return unwrapList(payload).map(normalizeBoardGame)
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
  const match = unwrapEntity(payload, ['match'])
  return {
    ...match,
    id: getEntityId(match),
  }
}

export async function updateMatchScores(matchId, playerScores) {
  return request(`/matches/${matchId}/scores`, {
    method: 'PUT',
    body: JSON.stringify({
      player_scores: playerScores,
    }),
  })
}

export async function completeMatch(matchId) {
  return request(`/matches/${matchId}/complete`, {
    method: 'POST',
  })
}

export function getId(entity) {
  return getEntityId(entity)
}
