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
        <section className="game-card-summary">
          <div className="detail-thumbnail">
            {overview.thumbnailUrl ? (
              <img
                src={overview.thumbnailUrl}
                alt="Thumbnail"
              />
            ) : (
              <span>{overview.name?.slice(0, 2).toUpperCase() || 'BG'}</span>
            )}
          </div>

          <div className="game-card-content">
            <h2>{overview.name}</h2>
            <p>
              {overview.minPlayers}-{overview.maxPlayers} người chơi • {overview.maxPlayTime || '--'} phút
            </p>
            <p>{categories || 'Board game'}</p>
          </div>
        </section>
        <section className="game-summary">
          <div className="summary-card">
            <span>TỔNG VÁN CHƠI</span>
            <strong>{overview.stats?.total_played ?? 0}</strong>
          </div>

          <div className="summary-card">
            <span>CHƠI GẦN ĐÂY</span>
            <strong>{formatLastPlayed(overview.stats?.last_played_at)}</strong>
          </div>
        </section>

        <section className="top-player-card" aria-label="Bang xep hang">
          <span className="top-player-title">BẢNG XẾP HẠNG</span>
          {leaders.map((item) => (
            <div key={item.user_id} className="top-player">
              <div className="top-player-info">
                <Image src={item.rank == 1 ? '/top1.svg' : item.rank == 2 ? '/top2.svg' : '/top3.svg'} alt='Avatar' width={24} height={24} />
                <Image src={item.avatar_url ? item.avatar_url : '/avatar-default.svg'} alt='Avatar' width={40} height={40} style={{ borderRadius: '50%' }} />
                <span>{item.name}</span>
              </div>
              <div className="totals-winner-matches">
                <span>THẮNG</span>
                <span>{item.wins}</span>
              </div>
            </div>
          ))}
        </section>

        <button className="score-create-btn" onClick={onCreateScore}>
          <Image src={'/plus-icon-white.svg'} alt='Avatar' width={24} height={24} />
          <span>Tạo bảng điểm</span>
        </button>
      </div>
    </div>
  )
}
