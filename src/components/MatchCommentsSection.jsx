import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getMatchComments, createMatchComment, deleteMatchComment } from '../api/backendService'
import { connectMatchComments } from '../api/matchRealtime'
import { Icon } from './ui/Icon'
import { Button } from './ui/Button'
import { NotificationPrompt } from './notifications/NotificationPrompt'

function normalizeComment(comment) {
  return {
    id: String(comment.id || comment._id || ''),
    content: comment.content || '',
    mentions: Array.isArray(comment.mentions) ? comment.mentions : [],
    createdAt: comment.created_at || comment.createdAt || '',
    user: {
      id: comment.user?.id || comment.user?._id || comment.user_id || '',
      name: comment.user?.name || comment.user_name || 'Người chơi',
      avatarUrl: comment.user?.avatar_url || comment.user?.avatarUrl || '',
    },
  }
}

function formatCommentTime(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(',', ' -')
}

function extractMentionIds(content) {
  const ids = []
  const regex = /@\[[^\]]+\]\(([^)]+)\)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[1])
  }
  return Array.from(new Set(ids))
}

function renderCommentContent(content) {
  if (!content) return ''
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g
  const elements = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      elements.push(content.substring(lastIndex, match.index))
    }
    const name = match[1]
    const userId = match[2]
    elements.push(
      <span key={`${userId}-${match.index}`} className="match-comment-mention" data-user-id={userId}>
        @{name}
      </span>
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    elements.push(content.substring(lastIndex))
  }

  return elements.length > 0 ? elements : content
}

function appendUniqueComment(comments, nextComment) {
  const normalized = normalizeComment(nextComment)
  if (!normalized.id) return comments
  if (comments.some((comment) => comment.id === normalized.id)) return comments
  return [...comments, normalized]
}

function mergeUniqueComments(primaryComments, secondaryComments) {
  return secondaryComments.reduce(
    (mergedComments, comment) => appendUniqueComment(mergedComments, comment),
    primaryComments.map(normalizeComment)
  )
}

export function MatchCommentsSection({ matchId, players = [], currentUser, toast }) {
  const [comments, setComments] = useState([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [deletingIds, setDeletingIds] = useState(new Set())
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected')

  // Mention state
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionStartIndex, setMentionStartIndex] = useState(null)
  const textareaRef = React.useRef(null)

  // Danh sách người chơi hợp lệ trong trận để tag
  const uniquePlayers = React.useMemo(() => {
    const seen = new Set()
    return (players || [])
      .map((p) => ({
        id: String(p.userId || p.id || p.user?._id || ''),
        name: p.name || p.user?.name || 'Người chơi',
        avatarUrl: p.avatarUrl || p.avatar_url || p.user?.avatar_url || '',
      }))
      .filter((p) => {
        if (!p.id || !p.name || seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
  }, [players])

  const filteredPlayers = React.useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    if (!q) return uniquePlayers
    return uniquePlayers.filter((p) => p.name.toLowerCase().includes(q))
  }, [uniquePlayers, mentionQuery])

  const checkMentionTrigger = useCallback((text, cursorPos) => {
    if (cursorPos === undefined || cursorPos === null) {
      setMentionQuery(null)
      setMentionStartIndex(null)
      return
    }

    const textBeforeCursor = text.slice(0, cursorPos)
    const match = textBeforeCursor.match(/(?:^|\s)@([^\s@]*)$/)
    if (match) {
      const query = match[1]
      const atIndex = textBeforeCursor.lastIndexOf('@' + query)
      setMentionQuery(query)
      setMentionStartIndex(atIndex)
    } else {
      setMentionQuery(null)
      setMentionStartIndex(null)
    }
  }, [])

  const handleSelectPlayer = useCallback(
    (player) => {
      if (mentionStartIndex === null || !textareaRef.current) return

      const cursorPos = textareaRef.current.selectionStart || draft.length
      const before = draft.slice(0, mentionStartIndex)
      const after = draft.slice(cursorPos)
      const tagText = `@[${player.name}](${player.id}) `
      const nextDraft = before + tagText + after

      setDraft(nextDraft)
      setMentionQuery(null)
      setMentionStartIndex(null)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const newCursor = before.length + tagText.length
          textareaRef.current.setSelectionRange(newCursor, newCursor)
        }
      }, 0)
    },
    [draft, mentionStartIndex]
  )

  // Load comments & setup socket
  useEffect(() => {
    let isMounted = true
    setComments([])
    setDraft('')
    setIsLoading(true)
    setRealtimeStatus('disconnected')

    getMatchComments(matchId)
      .then((items) => {
        if (!isMounted) return
        setComments((current) => mergeUniqueComments(items, current))
      })
      .catch(() => {
        if (isMounted) toast('Không tải được bình luận')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    const socket = connectMatchComments(
      matchId,
      (comment) => {
        if (isMounted) {
          setComments((current) => appendUniqueComment(current, comment))
        }
      },
      (deletedCommentId) => {
        if (isMounted) {
          setComments((current) => current.filter((c) => c.id !== deletedCommentId))
        }
      },
      (status) => {
        if (isMounted) setRealtimeStatus(status)
      }
    )

    return () => {
      isMounted = false
      socket?.emit('match:leave', matchId)
      socket?.disconnect()
    }
  }, [matchId, toast])

  // Submit comment
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || isSending) return

    setIsSending(true)
    const mentions = extractMentionIds(content)
    try {
      const comment = await createMatchComment(matchId, content, mentions)
      setComments((current) => appendUniqueComment(current, comment))
      setDraft('')
      setMentionQuery(null)
      setMentionStartIndex(null)
    } catch (error) {
      toast(error?.message || 'Không gửi được bình luận')
    } finally {
      setIsSending(false)
    }
  }, [draft, isSending, matchId, toast])

  const handleDraftKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent?.isComposing) return

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }, [])

  // Delete comment
  const handleDelete = useCallback(async (commentId) => {
    if (deletingIds.has(commentId)) return

    setDeletingIds((prev) => {
      const next = new Set(prev)
      next.add(commentId)
      return next
    })

    try {
      await deleteMatchComment(matchId, commentId)
      setComments((current) => current.filter((c) => c.id !== commentId))
      toast('Đã xóa bình luận')
    } catch (error) {
      toast(error?.message || 'Không thể xóa bình luận')
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }, [matchId, deletingIds, toast])

  return (
    <section className="match-comments-section" aria-label="Bình luận trận đấu">
      <NotificationPrompt toast={toast} activeStep="history-detail" />
      <div className="match-comments-heading">
        <h2>Bình luận</h2>
        <span>({comments.length} bình luận)</span>
      </div>

      <div className="match-comments-list" aria-busy={isLoading}>
        {isLoading ? <p className="match-comments-empty">Đang tải bình luận...</p> : null}
        {!isLoading && comments.length === 0 ? (
          <p className="match-comments-empty">Chưa có bình luận nào. Mở màn trước đi.</p>
        ) : null}
        {comments.map((comment) => {
          const isOwner = currentUser && String(comment.user.id) === String(currentUser.id)
          const isAdmin = currentUser && currentUser.role === 'ADMIN'
          const createdAtTime = comment.createdAt ? new Date(comment.createdAt).getTime() : 0
          const ageMs = Date.now() - createdAtTime
          const isUnder7Days = ageMs < 7 * 24 * 60 * 60 * 1000
          const canDelete = isAdmin || (isOwner && isUnder7Days)
          const showWarning = !isAdmin && isOwner && isUnder7Days

          return (
            <article key={comment.id} className="match-comment-item">
              <div className="match-comment-avatar" aria-hidden="true">
                {comment.user.avatarUrl ? (
                  <Image src={comment.user.avatarUrl} width={40} height={40} alt="" />
                ) : (
                  <span>{comment.user.name.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="match-comment-body">
                <div className="match-comment-details">
                  <div className="match-comment-meta">
                    <strong className="match-comment-user">{comment.user.name}</strong>
                    <span className="match-comment-time">{formatCommentTime(comment.createdAt)}</span>
                  </div>
                  <p className="match-comment-text">{renderCommentContent(comment.content)}</p>
                </div>
                
                {canDelete ? (
                  <div className="match-comment-actions">
                    {showWarning ? (
                      <span className="match-comment-delete-warning">
                        Chỉ có thể xóa trong vòng 7 ngày.
                      </span>
                    ) : (
                      <span className="match-comment-delete-warning" />
                    )}
                    <button
                      type="button"
                      className="match-comment-delete-btn"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingIds.has(comment.id)}
                      aria-label="Xóa bình luận"
                    >
                      <Icon src="/trash.png" color="#FFFFFF" size={16} />
                      <span>Xóa</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      {currentUser ? (
        <form className="match-comment-form-container" onSubmit={handleSubmit}>
          {mentionQuery !== null && filteredPlayers.length > 0 ? (
            <div className="match-comment-mention-bar" role="listbox" aria-label="Gợi ý người chơi để tag">
              <span className="match-comment-mention-label">Nhắc đến:</span>
              <div className="match-comment-mention-chips">
                {filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    className="match-comment-mention-chip"
                    onClick={() => handleSelectPlayer(player)}
                  >
                    {player.avatarUrl ? (
                      <Image
                        src={player.avatarUrl}
                        alt=""
                        width={20}
                        height={20}
                        className="match-comment-mention-chip-avatar"
                      />
                    ) : (
                      <span className="match-comment-mention-chip-avatar-placeholder">
                        {player.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="match-comment-mention-chip-name">{player.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="match-comment-form">
            <div className="match-comment-input-wrapper">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value)
                  checkMentionTrigger(event.target.value, event.target.selectionStart)
                }}
                onSelect={(event) => {
                  checkMentionTrigger(event.target.value, event.target.selectionStart)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && mentionQuery !== null) {
                    setMentionQuery(null)
                    setMentionStartIndex(null)
                    return
                  }
                  handleDraftKeyDown(event)
                }}
                placeholder="Để lại bình luận... Gõ @ để tag"
                maxLength={1000}
                rows={1}
              />
            </div>
            <button
              type="submit"
              className="match-comment-send-btn"
              disabled={!draft.trim() || isSending}
              aria-label="Gửi bình luận"
            >
              <Icon src="/send.png" color="#FFFFFF" size={24} />
            </button>
          </div>
        </form>
      ) : (
        <p className="match-comments-empty">Đăng nhập để bình luận.</p>
      )}
    </section>
  )
}
