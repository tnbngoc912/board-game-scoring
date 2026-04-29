const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://boardgame-scorer-backend.onrender.com/api/v1'

function getEntityId(entity) {
  return entity?._id || entity?.id || entity?.match_id
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

function normalizeUser(user) {
  return {
    ...user,
    id: getEntityId(user),
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

export function normalizeMatch(match) {
  const players = match.players || []
  const winner = players.find((player) => player.is_winner)

  return {
    id: match.match_id || getEntityId(match),
    gameName: match.board_game_name || match.gameName || 'Khong ten',
    gameId: match.board_game_id,
    playedAt: match.play_date ? new Date(match.play_date).toLocaleString('vi-VN') : '',
    playerCount: match.player_count || players.length,
    description: match.description || '',
    winner: winner ? {
      id: winner.user_id,
      name: winner.name,
      total: winner.total_score ?? 0,
    } : null,
    players: players
      .map((player, index) => ({
        id: player.user_id || player.id || player._id || player.name,
        name: player.name,
        color: undefined,
        total: player.total_score ?? player.total ?? 0,
        rank: player.rank ?? index + 1,
      }))
      .sort((a, b) => a.rank - b.rank),
    scoreRows: match.score_rows || match.scoreRows || [],
  }
}

export function normalizeMatchDetail(payload) {
  const match = payload.match || payload
  const boardGame = match.board_game_id || match.boardGame || {}
  const scoreColumns = boardGame.score_columns || boardGame.scoreColumns || []
  const players = payload.players || match.players || []
  const normalizedPlayers = players
    .map((player, index) => ({
      id: getEntityId(player.user_id) || player.user_id || getEntityId(player),
      name: player.user_id?.name || player.name,
      total: player.total_score ?? 0,
      rank: player.rank ?? index + 1,
      isWinner: Boolean(player.is_winner),
      scores: player.scores || {},
    }))
    .sort((a, b) => a.rank - b.rank)
  const winner = normalizedPlayers.find((player) => player.isWinner)

  return {
    id: getEntityId(match),
    gameName: boardGame.name || match.board_game_name || match.gameName || 'Khong ten',
    gameId: getEntityId(boardGame) || match.board_game_id,
    playedAt: match.play_date ? new Date(match.play_date).toLocaleString('vi-VN') : '',
    playerCount: match.player_count || normalizedPlayers.length,
    description: match.description || '',
    winner: winner ? { id: winner.id, name: winner.name, total: winner.total } : null,
    players: normalizedPlayers,
    scoreRows: scoreColumns.map((column, index) => ({
      ...normalizeScoreColumn(column, index),
      scores: normalizedPlayers.reduce((scores, player) => {
        scores[player.id] = player.scores?.[column.id] ?? 0
        return scores
      }, {}),
    })),
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
      avatar_drive_id: '',
    }),
  })
  const user = unwrapEntity(payload, ['user'])

  return {
    ...user,
    id: getEntityId(user),
  }
}

export async function getUsers() {
  const payload = await request('/users')
  return unwrapList(payload).map(normalizeUser)
}

export async function getBoardGames() {
  const payload = await request('/board-games')
  return unwrapList(payload).map(normalizeBoardGame)
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

export async function updateMatchScores(matchId, { description, playerScores }) {
  return request(`/matches/${matchId}/scores`, {
    method: 'PUT',
    body: JSON.stringify({
      description,
      player_scores: playerScores,
    }),
  })
}

export function getId(entity) {
  return getEntityId(entity)
}
