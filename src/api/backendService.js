const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://boardgame-scorer-backend.onrender.com/api/v1'
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

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getPopulatedBoardGame(match) {
  const candidates = [match.board_game, match.boardGame, match.board_game_id]
  return candidates.find(isPlainObject) || {}
}

function humanizeScoreId(value, index = 0) {
  const label = String(value || '').trim()
  if (!label) return `Score ${index + 1}`

  return label
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function getScoreValue(scores, columnId, fallbackId) {
  if (!scores) return undefined
  if (scores[columnId] !== undefined) return scores[columnId]
  if (fallbackId && scores[fallbackId] !== undefined) return scores[fallbackId]
  return undefined
}

function normalizeRawScoreRows(rawRows, players) {
  if (!Array.isArray(rawRows)) return []

  return rawRows.map((row, index) => {
    const columnId = row.id || row._id || row.score_column_id || row.scoreColumnId || row.key || `score-${index + 1}`
    const normalizedColumn = normalizeScoreColumn({
      id: columnId,
      name: row.name || row.label || humanizeScoreId(columnId, index),
      type: row.type,
      weight: row.weight,
    }, index)
    const rowScores = row.scores || row.values || {}

    return {
      ...normalizedColumn,
      scores: players.reduce((scores, player) => {
        scores[player.id] = getScoreValue(rowScores, player.id, player.userId) ?? 0
        return scores
      }, {}),
    }
  })
}

function buildScoreRowsFromPlayerScores(players) {
  const scoreIds = [...new Set(players.flatMap((player) => Object.keys(player.scores || {})))]

  return scoreIds.map((scoreId, index) => ({
    id: scoreId,
    name: humanizeScoreId(scoreId, index),
    type: 'number',
    weight: 1,
    scores: players.reduce((scores, player) => {
      scores[player.id] = player.scores?.[scoreId] ?? 0
      return scores
    }, {}),
  }))
}

export function normalizeBoardGame(game) {
  const scoreColumns = game.score_columns || game.scoreColumns || game.categories || []

  return {
    ...game,
    id: getEntityId(game),
    scoringType: game.scoring_type || game.scoringType || 'COLUMN_BASED',
    categories: scoreColumns.map(normalizeScoreColumn),
  }
}

export function normalizeMatch(match) {
  const players = match.players || []
  const winnerIds = new Set(match.winner_ids || match.winnerIds || [])
  const winner = players.find((player) => player.is_winner || winnerIds.has(player.user_id || player.id || player._id))
  const boardGame = getPopulatedBoardGame(match)

  return {
    id: match.match_id || getEntityId(match),
    gameName: match.board_game_name || match.gameName || 'Khong ten',
    gameId: match.board_game_id,
    scoringType: match.scoring_type || match.scoringType || boardGame.scoring_type || boardGame.scoringType || 'COLUMN_BASED',
    playedAtRaw: match.play_date || match.created_at || match.updated_at || '',
    playedAt: match.play_date
      ? (() => {
        const d = new Date(match.play_date);

        const time = d.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        const date = d.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        return `${time} - ${date}`;
      })()
      : '',
    playerCount: match.player_count || players.length,
    description: match.description || '',
    thumbnailUrl: match.thumbnail_url || '',
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
  const boardGame = getPopulatedBoardGame(match)
  const scoreColumns = boardGame.score_columns || boardGame.scoreColumns || match.score_columns || match.scoreColumns || []
  const rawScoreRows = match.score_rows || match.scoreRows || payload.score_rows || payload.scoreRows || []
  const players = payload.players || match.players || []
  const winnerIds = new Set(match.winner_ids || match.winnerIds || payload.winner_ids || payload.winnerIds || [])
  const normalizedPlayers = players
    .map((player, index) => {
      const id = getEntityId(player.user_id) || player.user_id || getEntityId(player)

      return {
        id,
        userId: id,
        name: player.user_id?.name || player.name,
        total: player.total_score ?? 0,
        rank: player.rank ?? index + 1,
        isWinner: Boolean(player.is_winner || winnerIds.has(id)),
        scores: player.scores || {},
      }
    })
    .sort((a, b) => a.rank - b.rank)
  const winner = normalizedPlayers.find((player) => player.isWinner)
  const scoreRowsFromColumns = scoreColumns.map((column, index) => ({
    ...normalizeScoreColumn(column, index),
    scores: normalizedPlayers.reduce((scores, player) => {
      scores[player.id] = player.scores?.[column.id || column._id] ?? 0
      return scores
    }, {}),
  }))
  const scoreRows = scoreRowsFromColumns.length > 0
    ? scoreRowsFromColumns
    : normalizeRawScoreRows(rawScoreRows, normalizedPlayers)

  return {
    id: getEntityId(match),
    gameName: boardGame.name || match.board_game_name || match.gameName || 'Khong ten',
    gameId: getEntityId(boardGame) || match.board_game_id,
    scoringType: match.scoring_type || match.scoringType || boardGame.scoring_type || boardGame.scoringType || 'COLUMN_BASED',
    playedAtRaw: match.play_date || match.created_at || match.updated_at || '',
    playedAt: match.play_date ? new Date(match.play_date).toLocaleString('vi-VN') : '',
    playerCount: match.player_count || normalizedPlayers.length,
    description: match.description || '',
    thumbnailUrl: match.thumbnail_url || '',
    imageAttachments: match.image_attachments || [],
    winner: winner ? { id: winner.id, name: winner.name, total: winner.total } : null,
    players: normalizedPlayers,
    scoreRows: scoreRows.length > 0 ? scoreRows : buildScoreRowsFromPlayerScores(normalizedPlayers),
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

function normalizeAuthUser(user) {
  return {
    id: getEntityId(user),
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'USER',
    avatar: user?.avatar || '',
    avatar_url: user?.avatar_url || '',
    stats: user?.stats || null,
  }
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

export async function updateMatchScores(matchId, { description, playerScores, winnerIds }) {
  const body = {
    description,
  }

  if (winnerIds) {
    body.winner_ids = winnerIds
  } else {
    body.player_scores = playerScores
  }

  return request(`/matches/${matchId}/scores`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteMatch(matchId) {
  return request(`/matches/${matchId}`, {
    method: 'DELETE',
  })
}

export function getId(entity) {
  return getEntityId(entity)
}
