'use client'

import React, { useEffect, useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { BottomNav } from '../components/navigation/BottomNav'
import { useAuthStore } from '../store/authStore'
import { useAppDataStore } from '../store/appDataStore'
import { Header } from '../components/Header'
import { PullToRefresh } from '../components/ui/PullToRefresh'
import Image from 'next/image'

// Skeleton cho mỗi card game stats (đồng bộ visual với History nhưng giữ kích thước nhỏ gọn của Achievements)
function GameCardSkeleton() {
  return (
    <div className="game-stat-card game-card-skeleton" aria-hidden="true">
      <div className="game-card-thumb" style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)' }} />
      <div className="game-stat-info">
        <span className="game-card-skeleton-line title" />
        <span className="game-card-skeleton-line" />
      </div>
    </div>
  )
}

export function AchievementsShell() {
  const { user, refreshProfile } = useAuthStore()
  const { userGameStats, fetchUserGameStats, userGameStatsFetchedAt } = useAppDataStore()
  const [isInitializing, setIsInitializing] = useState(userGameStatsFetchedAt === 0)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.navigator.standalone || 
                         window.matchMedia('(display-mode: standalone)').matches ||
                         new URLSearchParams(window.location.search).get('test-pwa') === 'true'
      setIsStandalone(standalone)
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        const freshUser = await refreshProfile()
        const userId = freshUser?.id || freshUser?._id || user?.id || user?._id
        if (userId) {
          await fetchUserGameStats(userId)
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin thành tựu:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    loadData()
  }, [refreshProfile, fetchUserGameStats, user?.id, user?._id])

  // Trích xuất các chỉ số từ profile
  const totalGamesPlayed = user?.stats?.total_games_played || 0
  const totalWins = user?.stats?.total_wins || 0
  const winRate = user?.stats?.win_rate || 0

  const statsSummary = [
    { label: 'Tổng ván chơi', value: totalGamesPlayed },
    { label: 'Tổng ván thắng', value: totalWins },
    { label: 'Tỉ lệ thắng', value: `${winRate}%` },
  ]

  return (
    <ProtectedScreen>
      <div className="app-shell screen-achievements">
        <div className={`achievements-screen${isStandalone ? ' has-ptr' : ''}`}>
          <Header />

          <PullToRefresh onRefresh={async () => {
            try {
              const freshUser = await refreshProfile()
              const userId = freshUser?.id || freshUser?._id || user?.id || user?._id
              if (userId) {
                await fetchUserGameStats(userId, { force: true })
              }
            } catch (err) {
              console.error(err)
            }
          }}>
            <div className="achievements-content">
            <div className="achievements-header">
              <h1>Thành tựu</h1>
              <div className="achievements-subtitle">Thống kê thành tích chơi của bạn</div>
            </div>

            {/* Thống kê chung */}
            <div className="achievements-stats">
              {statsSummary.map((stat, i) => (
                <div className="stat-box" key={i}>
                  <div className="stat-val">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Thống kê theo Board Game */}
            <div className="achievements-section-title">
              <Gamepad2 size={20} className="section-title-icon" />
              <span>Thống kê theo Board Game</span>
            </div>

            <div className="achievements-games-list">
              {isInitializing ? (
                <>
                  {Array.from({ length: 6 }).map((i) => (
                    <GameCardSkeleton key={i} />
                  ))}
                </>
              ) : userGameStats.length > 0 ? (
                userGameStats.map((game, index) => (
                  <div className="game-stat-card" key={index}>
                    <div className="game-stat-thumb-wrapper">
                      {game.thumbnail_url ? (
                        <Image
                          src={game.thumbnail_url}
                          alt={game.board_game_name}
                          className="game-stat-thumb"
                          width={44}
                          height={44}
                        />
                      ) : (
                        <div className="game-stat-thumb-fallback">
                          <Gamepad2 size={20} />
                        </div>
                      )}
                    </div>
                    <div className="game-stat-info">
                      <div className="game-stat-name">{game.board_game_name}</div>
                      <div className="game-stat-details">
                        <div className="game-stat-detail">
                          Số ván: <span>{game.played_count}</span>
                        </div>
                        <div className="game-stat-detail">
                          Tỉ lệ thắng: <span>{game.win_rate}%</span>
                        </div>
                        {game.best_score !== undefined && game.scoring_type !== 'WINNER_ONLY' && (
                          <div className="game-stat-detail">
                            Kỷ lục: <span>{game.best_score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="game-stats-empty">
                  Bạn chưa lưu ván đấu nào. Hãy bắt đầu chơi và ghi điểm để tích lũy thành tích nhé!
                </div>
              )}
            </div>
          </div>
          </PullToRefresh>
        </div>
        <BottomNav />
      </div>
    </ProtectedScreen>
  )
}
