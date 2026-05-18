import { getEntityId } from './entityMapper'

export function normalizeAuthUser(user) {
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

export function normalizeUser(user) {
  return {
    ...user,
    id: getEntityId(user),
  }
}
