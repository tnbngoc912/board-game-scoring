'use client'

import React, { useState, useEffect } from 'react'
import { Gamepad2 } from 'lucide-react'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { BottomNav } from '../components/navigation/BottomNav'
import { useAuthStore } from '../store/authStore'
import { useAppDataStore } from '../store/appDataStore'
import { Header } from '../components/Header'
import Image from 'next/image'

// Skeleton cho stats tổng quan (3 ô)
function StatsSkeleton() {
  return (
    <div className="skeleton-stats">
      {[0, 1, 2].map((i) => (
        <div className="skeleton-stat-box" key={i}>
          <div className="skeleton skeleton-stat-val" />
          <div className="skeleton skeleton-stat-label" />
        </div>
      ))}
    </div>
  )
}

// Skeleton cho mỗi card game stats
function GameCardSkeleton() {
  return (
    <div className="skeleton-game-card">
      <div className="skeleton skeleton-game-thumb" />
      <div className="skeleton-game-info">
        <div className="skeleton skeleton-game-name" />
        <div className="skeleton-game-details">
          <div className="skeleton skeleton-game-detail" />
          <div className="skeleton skeleton-game-detail" />
        </div>
      </div>
    </div>
  )
}

// Skeleton cho toàn bộ nội dung
function AchievementsSkeleton() {
  return (
    <>
      <StatsSkeleton />
      <div className="skeleton-section-title">
        <div className="skeleton skeleton-title-icon" />
        <div className="skeleton skeleton-title-text" />
      </div>
      <div className="skeleton-games-list">
        {[0, 1, 2].map((i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    </>
  )
}

export function AchievementsShell() {
  const { user, refreshProfile } = useAuthStore()
  const { userGameStats, fetchUserGameStats, isLoadingUserGameStats } = useAppDataStore()
  const [isInitLoading, setIsInitLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Chỉ hiện skeleton ở lần đầu tiên vào trang
        setIsInitLoading(true)
        const freshUser = await refreshProfile()
        const userId = freshUser?.id || freshUser?._id || user?.id || user?._id
        if (userId) {
          await fetchUserGameStats(userId)
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin thành tựu:', error)
      } finally {
        setIsInitLoading(false)
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

  const isLoading = isInitLoading || isLoadingUserGameStats

  return (
    <ProtectedScreen>
      <div className="app-shell screen-achievements">
        <div className="achievements-screen">
          <Header />

          <div className="achievements-content">
            <div className="achievements-header">
              <h1>Thành tựu</h1>
              <div className="achievements-subtitle">Thống kê thành tích chơi của bạn</div>
            </div>

            {isLoading ? (
              <AchievementsSkeleton />
            ) : (
              <>
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
                  {userGameStats.length > 0 ? (
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
                                Kỷ lục: <span>{game.best_score}đ</span>
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
              </>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    </ProtectedScreen>
  )
}
