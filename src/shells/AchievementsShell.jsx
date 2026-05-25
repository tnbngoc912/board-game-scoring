'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, Award, Gamepad2 } from 'lucide-react'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { BottomNav } from '../components/navigation/BottomNav'
import { useAuthStore } from '../store/authStore'
import { getUserGameStats } from '../api/backendService'
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
  const totalLastPlaces = user?.stats?.total_last_places || 0

  // Tìm điểm kỷ lục lớn nhất trong tất cả các game đã chơi
  const maxBestScore = gameStats.reduce((max, item) => Math.max(max, item.best_score || 0), 0)

  // Danh sách huy hiệu được tính toán động từ backend stats
  const badges = [
    {
      id: 1,
      title: 'Chiến Binh Kiên Trì',
      desc: 'Tham gia chơi ít nhất 10 ván đấu trên hệ thống.',
      unlocked: totalGamesPlayed >= 10,
      progress: Math.min(100, Math.round((totalGamesPlayed / 10) * 100)),
      icon: '⚡',
    },
    {
      id: 2,
      title: 'Nhà Vô Địch',
      desc: 'Giành chiến thắng ít nhất 5 ván đấu.',
      unlocked: totalWins >= 5,
      progress: Math.min(100, Math.round((totalWins / 5) * 100)),
      icon: '🏆',
    },
    {
      id: 3,
      title: 'Đỉnh Cao Điểm Số',
      desc: 'Ghi được từ 100 điểm trở lên trong một ván chơi bất kỳ.',
      unlocked: maxBestScore >= 100,
      progress: Math.min(100, Math.round((maxBestScore / 100) * 100)),
      icon: '🎯',
    },
    {
      id: 4,
      title: 'Bác Học Board Game',
      desc: 'Trải nghiệm ít nhất 5 loại board game khác nhau.',
      unlocked: gameStats.length >= 5,
      progress: Math.min(100, Math.round((gameStats.length / 5) * 100)),
      icon: '📚',
    },
    {
      id: 5,
      title: 'Người Vui Vẻ',
      desc: 'Nhận vị trí cuối bảng từ 3 lần trở lên (Thua keo này bày keo khác!).',
      unlocked: totalLastPlaces >= 3,
      progress: Math.min(100, Math.round((totalLastPlaces / 3) * 100)),
      icon: '🎈',
    },
  ]

  const unlockedCount = badges.filter((b) => b.unlocked).length

  const statsSummary = [
    { label: 'Tổng ván chơi', value: totalGamesPlayed },
    { label: 'Tỉ lệ thắng', value: `${winRate}%` },
    { label: 'Huy hiệu', value: `${unlockedCount}/${badges.length}` },
  ]

  return (
    <ProtectedScreen>
      <div className="app-shell screen-achievements">
        <div className="achievements-screen">
          <div className="achievements-header">
            <h1>Thành tựu</h1>
            <div className="achievements-subtitle">Thống kê và huy hiệu danh dự của bạn</div>
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

              {/* Huy hiệu */}
              <div className="achievements-section-title">
                <Award size={20} className="section-title-icon" />
                <span>Huy hiệu cá nhân</span>
              </div>

              <div className="achievements-grid">
                {badges.map((item) => (
                  <div key={item.id} className={`badge-card ${item.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="badge-icon-container">
                      <span style={{ fontSize: '24px' }}>{item.icon}</span>
                    </div>
                    <div className="badge-info">
                      <div className="badge-title">{item.title}</div>
                      <div className="badge-desc">{item.desc}</div>
                      {!item.unlocked && (
                        <div className="badge-progress">
                          <div className="badge-progress-bar" style={{ width: `${item.progress}%` }}></div>
                        </div>
                      )}
                    </div>
                    {item.unlocked && (
                      <span className="badge-date">Đã đạt</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Thống kê theo Board Game */}
              <div className="achievements-section-title" style={{ marginTop: '24px' }}>
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
        <BottomNav />
      </div>
    </ProtectedScreen>
  )
}
