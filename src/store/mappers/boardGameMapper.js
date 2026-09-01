import { getEntityId } from './entityMapper'

export function normalizeScoreColumn(column, index = 0) {
  return {
    id: column.id || column._id || `score-${index + 1}`,
    name: column.name,
    type: column.type === 'text' ? 'text' : 'number',
    weight: column.weight ?? 1,
  }
}

export function normalizeBoardGame(game) {
  const genres = game.genres || game.category_ids || game.categoryIds || game.categories || []
  const scoreColumns = game.score_columns || game.scoreColumns || game.categories || []

  return {
    ...game,
    id: getEntityId(game),
    genres,
    scoringType: game.scoring_type || game.scoringType || 'COLUMN_BASED',
    categories: scoreColumns.map(normalizeScoreColumn),
  }
}

export function normalizeBoardGameOverview(raw, fallbackBoardGameId = '') {
  const source = raw || {}
  const scoreColumns = source.score_columns || source.scoreColumns || []
  const overviewStats = source.overview_stats || null

  return {
    id: getEntityId(source) || fallbackBoardGameId,
    name: source.name || '',
    description: source.description || '',
    minPlayers: source.min_players ?? source.minPlayers ?? 1,
    maxPlayers: source.max_players ?? source.maxPlayers ?? 12,
    minPlayTime: source.min_play_time ?? source.minPlayTime ?? null,
    maxPlayTime: source.max_play_time ?? source.maxPlayTime ?? null,
    thumbnailUrl: source.thumbnail_url || source.thumbnailUrl || '',
    scoringType: source.scoring_type || source.scoringType || 'COLUMN_BASED',
    categories: scoreColumns.map(normalizeScoreColumn),
    stats: source.stats || (overviewStats ? {
      total_played: overviewStats.total_matches_count || 0,
      last_played_at: overviewStats.latest_match?.play_date || null,
    } : null),
    leaderboard: (source.leaderboard || overviewStats?.leaderboard || []).slice(0, 3),
    category: Array.isArray(source.categories) && source.categories[0]
      ? source.categories[0]
      : Array.isArray(source.category_ids) && source.category_ids[0]
        ? source.category_ids[0]
        : (source.category || {})
  }
}
