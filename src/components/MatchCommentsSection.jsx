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

export function MatchCommentsSection({ matchId, currentUser, toast }) {
  const [comments, setComments] = useState([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [deletingIds, setDeletingIds] = useState(new Set())
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected')

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
    try {
      const comment = await createMatchComment(matchId, content)
      setComments((current) => appendUniqueComment(current, comment))
      setDraft('')
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
                  <p className="match-comment-text">{comment.content}</p>
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
        <form className="match-comment-form" onSubmit={handleSubmit}>
          <div className="match-comment-input-wrapper">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleDraftKeyDown}
              placeholder="Để lại bình luận về ván chơi này..."
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
        </form>
      ) : (
        <p className="match-comments-empty">Đăng nhập để bình luận.</p>
      )}
    </section>
  )
}
