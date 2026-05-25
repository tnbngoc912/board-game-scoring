'use client'

import React, { useState, useEffect } from 'react'
import { Gamepad2 } from 'lucide-react'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { BottomNav } from '../components/navigation/BottomNav'
import { useAuthStore } from '../store/authStore'
import { getUserGameStats } from '../api/backendService'
import { Header } from '../components/Header'
import Image from 'next/image'

export function AchievementsShell() {
  const { user, refreshProfile } = useAuthStore()
  const [gameStats, setGameStats] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        // Refresh thông tin user để có stats mới nhất
        const freshUser = await refreshProfile()
        const userId = freshUser?.id || freshUser?._id || user?.id || user?._id
        if (userId) {
          const statsRes = await getUserGameStats(userId)
          setGameStats(statsRes?.results || statsRes || [])
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin thành tựu:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [refreshProfile, user?.id, user?._id])

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
        <div className="achievements-screen">
          <Header />

          <div className="achievements-content">
            <div className="achievements-header">
              <h1>Thành tựu</h1>
              <div className="achievements-subtitle">Thống kê thành tích chơi của bạn</div>
            </div>

            {isLoading ? (
              <div className="achievements-loading">
                <div className="achievements-spinner"></div>
                <span>Đang tải thành tựu...</span>
              </div>
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
                  {gameStats.length > 0 ? (
                    gameStats.map((game, index) => (
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
              </>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    </ProtectedScreen>
  )
}
