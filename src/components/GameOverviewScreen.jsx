import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { getBoardGameOverview } from '../api/backendService'
import { useGameStore } from '../store/gameStore'
import { useGameSessionStore } from '../store/gameSessionStore'
import { LoadingOverlay } from './LoadingOverlay'
import { EmptyState } from './ui/EmptyState'

function formatLastPlayed(value) {
  if (!value) return '--/--/----'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--/--/----'
  return date.toLocaleDateString('vi-VN')
}

export function GameOverviewScreen({ boardGameId, onBack, onCreateScore, toast }) {
  const applyBoardGameOverview = useGameStore((state) => state.applyBoardGameOverview)
  const hydrateOverviewIfNeeded = useGameSessionStore((state) => state.hydrateOverviewIfNeeded)
  const setOverview = useGameSessionStore((state) => state.setOverview)

  const [overview, setLocalOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      if (!boardGameId) return

      const cached = hydrateOverviewIfNeeded(boardGameId)
      if (cached) {
        applyBoardGameOverview(cached)
        setLocalOverview(cached)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await getBoardGameOverview(boardGameId)
        if (!isMounted) return
        applyBoardGameOverview(data)
        setOverview(boardGameId, data)
        setLocalOverview(data)
      } catch (error) {
        if (!isMounted) return
        toast(error?.message || 'Khong tai duoc thong tin game')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [boardGameId, toast, applyBoardGameOverview, hydrateOverviewIfNeeded, setOverview])

  if (isLoading) {
    return (
      <div className="screen score-screen history-detail-screen loading-shell" aria-busy="true">
        <LoadingOverlay label="Đang tải..." />
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="screen score-screen loading-shell">
        <div className="screen-inner">
          <EmptyState title="Không có dữ liệu game" description="Vui lòng thử lại." />
        </div>
      </div>
    )
  }

  const categories = (overview.categories || []).map((item) => item.name).join(', ')
  const leaders = overview.leaderboard || []

  return (
    <div className="screen score-screen history-detail-screen">
      <header className="history-phone-header history-detail-header" aria-label="BGScore">
        <div className="history-detail-topbar">
          <button className="score-back-btn" onClick={onBack} aria-label="Quay lai">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6 9 12l6 6" />
              <path d="M10 12h9" />
            </svg>
          </button>
          <div className="home-logo">BGSCORE</div>
          <div className="score-entry-spacer" aria-hidden="true" />
        </div>
      </header>

      <div className="screen-inner history-content">
        <section className="match-summary-strip">
          <div className="game-card-thumb detail-thumb">
            {overview.thumbnailUrl ? (
              <Image alt="" src={overview.thumbnailUrl} width={78} height={78} />
            ) : (
              <span>{overview.name?.slice(0, 2).toUpperCase() || 'BG'}</span>
            )}
          </div>
          <div>
            <h2>{overview.name}</h2>
            <p>{overview.minPlayers}-{overview.maxPlayers} người chơi • {overview.maxPlayTime || '--'} phút</p>
            <p>{categories || 'Board game'}</p>
          </div>
        </section>

        <section className="winner-picker-card">
          <div className="winner-picker-row">
            <span>TỔNG VÁN CHƠI</span>
            <strong>{overview.stats?.total_played ?? 0}</strong>
          </div>
          <div className="winner-picker-row">
            <span>CHƠI GẦN ĐÂY</span>
            <strong>{formatLastPlayed(overview.stats?.last_played_at)}</strong>
          </div>
        </section>

        <section className="winner-only-list" aria-label="Bang xep hang">
          {leaders.map((item) => (
            <div key={item.user_id} className="winner-only-player">
              <span>#{item.rank} {item.name}</span>
              <div className="winner-only-crown-row">THẮNG {item.wins}</div>
            </div>
          ))}
        </section>

        <button className="score-save-btn" onClick={onCreateScore}>
          Tạo bảng điểm
        </button>
      </div>
    </div>
  )
}
