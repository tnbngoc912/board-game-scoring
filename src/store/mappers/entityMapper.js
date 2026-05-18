export function getEntityId(entity) {
  return entity?._id || entity?.id || entity?.match_id
}

export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.board_games)) return payload.board_games
  if (Array.isArray(payload?.boardGames)) return payload.boardGames
  return []
}

export function unwrapEntity(payload, keys = []) {
  if (!payload) return payload

  for (const key of keys) {
    if (payload[key]) return payload[key]
  }

  return payload
}
