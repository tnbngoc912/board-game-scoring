import { io } from 'socket.io-client'
import { getCurrentAuthToken, getRealtimeBaseUrl } from './backendService'

export function connectMatchComments(matchId, onCommentCreated, onStatusChange) {
  const token = getCurrentAuthToken()
  if (!matchId || !token) return null

  const socket = io(getRealtimeBaseUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    socket.emit('match:join', matchId)
    onStatusChange?.('connected')
  })

  socket.on('connect_error', () => {
    onStatusChange?.('error')
  })

  socket.on('disconnect', () => {
    onStatusChange?.('disconnected')
  })

  socket.on('match:comment-created', (comment) => {
    onCommentCreated?.(comment)
  })

  return socket
}
