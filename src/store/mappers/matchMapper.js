import { normalizeScoreColumn } from './boardGameMapper'
import { getEntityId } from './entityMapper'

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

function formatPlayedAt(value) {
  if (!value) return ''

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  const time = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const date = d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return `${time} - ${date}`
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
    playedAt: formatPlayedAt(match.play_date),
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
    playedAt: formatPlayedAt(match.play_date),
    playerCount: match.player_count || normalizedPlayers.length,
    description: match.description || '',
    thumbnailUrl: match.thumbnail_url || '',
    imageAttachments: match.image_attachments || [],
    winner: winner ? { id: winner.id, name: winner.name, total: winner.total } : null,
    players: normalizedPlayers,
    scoreRows: scoreRows.length > 0 ? scoreRows : buildScoreRowsFromPlayerScores(normalizedPlayers),
  }
}
