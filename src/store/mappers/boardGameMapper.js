import { getEntityId } from './entityMapper'

export function normalizeScoreColumn(column, index = 0) {
  const rawType = String(column.type || '').toUpperCase()
  const isSelect = rawType === 'SELECT'
  const isText = rawType === 'TEXT'

  return {
    id: column.id || column._id || `score-${index + 1}`,
    name: column.name,
    type: isSelect ? 'SELECT' : (isText ? 'text' : 'NUMBER'),
    options: Array.isArray(column.options) ? column.options : [],
    weight: column.weight ?? 1,
  }
}

export function normalizeBoardGame(game) {
  const genres = game.category_ids || game.categoryIds || game.genres || []
  const scoreColumns = game.score_columns || game.scoreColumns || []

  return {
    ...game,
    id: getEntityId(game),
    genres,
    scoringType: game.scoring_type || game.scoringType || 'COLUMN_BASED',
    score_columns: scoreColumns.map(normalizeScoreColumn),
    categories: scoreColumns.map(normalizeScoreColumn),
  }
}

export function normalizeBoardGameOverview(raw, fallbackBoardGameId = '') {
  const source = raw || {}
  const scoreColumns = source.score_columns || source.scoreColumns || []
  const genres = source.category_ids || source.categoryIds || source.genres || []

  return {
    id: getEntityId(source) || fallbackBoardGameId,
    name: source.name || '',
    description: source.description || '',
    minPlayers: source.min_players ?? source.minPlayers ?? 1,
    maxPlayers: source.max_players ?? source.maxPlayers ?? 12,
    minPlayTime: source.min_play_time ?? source.minPlayTime ?? null,
    maxPlayTime: source.max_play_time ?? source.maxPlayTime ?? null,
    thumbnailUrl: source.thumbnail_url || '',
    scoringType: source.scoring_type || source.scoringType || 'COLUMN_BASED',
    score_columns: scoreColumns.map(normalizeScoreColumn),
    categories: scoreColumns.map(normalizeScoreColumn),
    stats: source.stats || null,
    leaderboard: source.leaderboard || [],
    category: Array.isArray(genres) ? genres[0] : genres
  }
}
