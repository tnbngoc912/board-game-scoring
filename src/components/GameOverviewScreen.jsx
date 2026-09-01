import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { getBoardGameOverview } from '../api/backendService'
import { useGameStore } from '../store/gameStore'
import { useGameSessionStore } from '../store/gameSessionStore'
import { LoadingOverlay } from './LoadingOverlay'
import { EmptyState } from './ui/EmptyState'
import { Header } from './Header'
import { Icon } from './ui/Icon';
import { usePermissions } from '../hooks/usePermissions'

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
  const { match } = usePermissions()
  const { canCreate } = match

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
        toast(error?.message || 'Không tải được thông tin game')
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
      <div className="game-overview-screen loading-shell" aria-busy="true">
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

  const leaders = overview.leaderboard || []

  return (
    <div className="game-overview-screen">
      <Header onBack={onBack} />

      <main className="overview-content">
        <section className="overview-game-banner">
          <div className="overview-game-thumb">
            {overview.thumbnailUrl ? (
              <Image
                alt=""
                src={overview.thumbnailUrl}
                width={112}
                height={79}
                sizes="100vw"
                style={{ width: 'auto', height: '79px', borderRadius: '4px' }}
              />
            ) : (
              <span>{overview.name?.slice(0, 2).toUpperCase() || 'BG'}</span>
            )}
          </div>
          <div className="overview-game-details">
            <h2 className="overview-game-title">{overview.name}</h2>
            <p className="overview-game-meta">
              {overview.minPlayers}-{overview.maxPlayers} người chơi • {overview.maxPlayTime || '--'} phút
            </p>
            <p className="overview-game-genre">{overview.category.name || 'Board game'}</p>
          </div>
        </section>

        <section className="overview-stats-grid">
          <div className="overview-stat-card">
            <span className="overview-stat-label">Tổng ván chơi</span>
            <strong className="overview-stat-value">{overview.stats?.total_played ?? 0}</strong>
          </div>
          <div className="overview-stat-card">
            <span className="overview-stat-label">Chơi gần đây</span>
            <strong className="overview-stat-value">{formatLastPlayed(overview.stats?.last_played_at)}</strong>
          </div>
        </section>

        <section className="overview-leaderboard-section">
          <h3 className="overview-section-title">Bảng xếp hạng</h3>
          <div className="overview-leaderboard-list" aria-label="Bảng xếp hạng">
            {leaders.map((item) => {
              let rankClass = 'rank-other'
              if (item.rank === 1) rankClass = 'rank-1'
              else if (item.rank === 2) rankClass = 'rank-2'
              else if (item.rank === 3) rankClass = 'rank-3'

              return (
                <article key={item.user_id} className="leaderboard-item-card">
                  <div className="leaderboard-player-info">
                    <div className={`leaderboard-rank ${rankClass}`}>
                      #{item.rank}
                    </div>
                    <div className="leaderboard-avatar">
                      {(item.avatar_url || item.avatarUrl) ? (
                        <Image src={item.avatar_url || item.avatarUrl} alt="" width={40} height={40} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                    <h4 className="leaderboard-name">{item.name}</h4>
                  </div>
                  <div className="leaderboard-wins-box">
                    <span className="leaderboard-wins-label">Thắng</span>
                    <strong className="leaderboard-wins-count">{item.wins}</strong>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {canCreate && (
          <button className="overview-action-btn" onClick={onCreateScore}>
            <Icon src="/add_icon.png" color="#FFFF" size={24} />
            <p className="overview-action-btn-text">Tạo bảng điểm</p>
          </button>
        )}
      </main>
    </div>
  )
}
