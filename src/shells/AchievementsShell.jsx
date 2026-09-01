'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Gamepad2 } from 'lucide-react'
import { Icon } from '../components/ui/Icon'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { BottomNav } from '../components/navigation/BottomNav'
import { useAuthStore } from '../store/authStore'
import { Header } from '../components/Header'
import { PullToRefresh } from '../components/ui/PullToRefresh'

// Framer motion variants cho hiệu ứng xuất hiện mượt mà
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

const cardItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' },
  },
}

function formatDate(dateStr) {
  if (!dateStr) return '--/--/----'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '--/--/----'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function GameThumb({ src, alt, size = 48, radius = 6 }) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="achievements-thumb-box" style={{ width: size, height: size, borderRadius: radius }}>
        <Gamepad2 size={size > 40 ? 24 : 18} className="achievements-thumb-fallback" />
      </div>
    )
  }

  return (
    <div className="achievements-thumb-box" style={{ width: size, height: size, borderRadius: radius }}>
      <Image
        src={src}
        alt={alt || 'Game'}
        width={size}
        height={size}
        className="achievements-thumb-img"
        unoptimized
        onError={() => setError(true)}
      />
    </div>
  )
}

function UserProfileCard({ userName, avatarUrl, totalGamesPlayed }) {
  return (
    <motion.div variants={cardItemVariants} className="achievements-user-card">
      <div className="achievements-user-profile">
        <div className="achievements-user-avatar-wrap">
          <Image
            src={avatarUrl}
            alt={userName}
            width={40}
            height={40}
            className="achievements-user-avatar"
            unoptimized
          />
        </div>
        <div className="achievements-user-name" title={userName}>
          {userName}
        </div>
      </div>
      <div className="achievements-divider-vert" aria-hidden="true" />
      <div className="achievements-user-total">
        <span className="achievements-stat-label-sm">TỔNG VÁN CHƠI</span>
        <span className="achievements-stat-val-md">{totalGamesPlayed}</span>
      </div>
    </motion.div>
  )
}

function MetricCard({ label, value, iconSrc }) {
  return (
    <motion.div variants={cardItemVariants} className="achievements-metric-card">
      <div className="achievements-metric-info">
        <span className="achievements-stat-label-sm">{label}</span>
        <span className="achievements-stat-val-md">{value}</span>
      </div>
      <div className="achievements-metric-icon" aria-hidden="true">
        <Icon src={iconSrc} size={40} color="var(--color-brand-600)" />
      </div>
    </motion.div>
  )
}

function MetricGrid({ totalBoardGamesPlayed, winRate, totalWins, totalLastPlaces }) {
  return (
    <div className="achievements-metric-grid">
      <MetricCard label="SỐ GAME ĐÃ CHƠI" value={totalBoardGamesPlayed} iconSrc="/layer.png" />
      <MetricCard label="TỈ LỆ THẮNG" value={`${winRate}%`} iconSrc="/rate.png" />
      <MetricCard label="SỐ VÁN THẮNG" value={totalWins} iconSrc="/cup.png" />
      <MetricCard label="SỐ VÁN CHÓT" value={totalLastPlaces} iconSrc="/dislike.png" />
    </div>
  )
}

function RecentPlayCard({ lastPlayedDate, lastPlayedGameName }) {
  return (
    <motion.div variants={cardItemVariants} className="achievements-recent-card">
      <div className="achievements-recent-date-col">
        <span className="achievements-stat-label-sm">LẦN CHƠI GẦN ĐÂY</span>
        <span className="achievements-stat-val-md">{formatDate(lastPlayedDate)}</span>
      </div>
      <div className="achievements-divider-vert" aria-hidden="true" />
      <div className="achievements-recent-game-col">
        <span className="achievements-stat-label-sm">GAME</span>
        <span className="achievements-recent-game-name" title={lastPlayedGameName}>
          {lastPlayedGameName}
        </span>
      </div>
    </motion.div>
  )
}

function HighlightGameCard({ label, game }) {
  return (
    <motion.div variants={cardItemVariants} className="achievements-highlight-card">
      <div className="achievements-highlight-info">
        <span className="achievements-stat-label-sm">{label}</span>
        <span className="achievements-highlight-name" title={game?.name || 'Chưa có'}>
          {game?.name || 'Chưa có'}
        </span>
      </div>
      <GameThumb src={game?.thumbnail_url} alt={game?.name} size={48} />
    </motion.div>
  )
}

function LeastRecentGroupCard({ game }) {
  return (
    <motion.div variants={cardItemVariants} className="achievements-group-card">
      <div className="achievements-group-header">
        <span className="achievements-stat-label-sm">GAME LÂU RỒI CHƯA CHƠI</span>
      </div>
      <div className="achievements-group-list">
        {game ? (
          <div className="achievements-list-item">
            <GameThumb src={game.thumbnail_url} alt={game.name} size={48} />
            <div className="achievements-list-item-info">
              <span className="achievements-list-item-title" title={game.name}>
                {game.name}
              </span>
              <span className="achievements-list-item-sub">
                Lần cuối chơi hồi {formatDate(game.last_played_at)}
              </span>
            </div>
          </div>
        ) : (
          <span className="achievements-empty-inline">Chưa có dữ liệu</span>
        )}
      </div>
    </motion.div>
  )
}

function TopRecordsGroupCard({ topRecordGames }) {
  return (
    <motion.div variants={cardItemVariants} className="achievements-group-card">
      <div className="achievements-group-header">
        <span className="achievements-stat-label-sm">NHỮNG GAME BẠN CÓ ĐIỂM CAO KỶ LỤC</span>
      </div>
      <div className="achievements-group-list">
        {topRecordGames.length > 0 ? (
          topRecordGames.map((game, idx) => (
            <div className="achievements-list-item" key={game.board_game_id || idx}>
              <GameThumb src={game.thumbnail_url} alt={game.name} size={48} />
              <div className="achievements-list-item-info">
                <span className="achievements-list-item-title" title={game.name}>
                  {game.name}
                </span>
                <span className="achievements-list-item-sub">
                  {game.best_score} điểm
                </span>
              </div>
            </div>
          ))
        ) : (
          <span className="achievements-empty-inline">Chưa có dữ liệu điểm kỷ lục</span>
        )}
      </div>
    </motion.div>
  )
}

function AchievementsSkeleton() {
  return (
    <>
      {/* 2. User Profile Banner Skeleton */}
      <div className="achievements-user-card" aria-hidden="true">
        <div className="achievements-user-profile">
          <div className="achievements-skeleton-box" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div className="achievements-skeleton-box" style={{ width: 90, height: 18, borderRadius: 4 }} />
        </div>
        <div className="achievements-divider-vert" />
        <div className="achievements-user-total">
          <div className="achievements-skeleton-box" style={{ width: 70, height: 12, borderRadius: 4, marginBottom: 4 }} />
          <div className="achievements-skeleton-box" style={{ width: 50, height: 18, borderRadius: 4 }} />
        </div>
      </div>

      {/* 3. 2x2 Metric Grid Skeleton */}
      <div className="achievements-metric-grid" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="achievements-metric-card">
            <div className="achievements-metric-info">
              <div className="achievements-skeleton-box" style={{ width: 65, height: 12, borderRadius: 4, marginBottom: 4 }} />
              <div className="achievements-skeleton-box" style={{ width: 45, height: 18, borderRadius: 4 }} />
            </div>
            <div className="achievements-skeleton-box" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* 4. Recent Play Skeleton */}
      <div className="achievements-recent-card" aria-hidden="true">
        <div className="achievements-recent-date-col">
          <div className="achievements-skeleton-box" style={{ width: 80, height: 12, borderRadius: 4, marginBottom: 4 }} />
          <div className="achievements-skeleton-box" style={{ width: 70, height: 18, borderRadius: 4 }} />
        </div>
        <div className="achievements-divider-vert" />
        <div className="achievements-recent-game-col">
          <div className="achievements-skeleton-box" style={{ width: 40, height: 12, borderRadius: 4, marginBottom: 4 }} />
          <div className="achievements-skeleton-box" style={{ width: '80%', height: 18, borderRadius: 4 }} />
        </div>
      </div>

      {/* 5. Highlight Cards Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="achievements-highlight-card" aria-hidden="true">
          <div className="achievements-highlight-info">
            <div className="achievements-skeleton-box" style={{ width: 110, height: 12, borderRadius: 4, marginBottom: 4 }} />
            <div className="achievements-skeleton-box" style={{ width: '70%', height: 18, borderRadius: 4 }} />
          </div>
          <div className="achievements-skeleton-box" style={{ width: 48, height: 48, borderRadius: 6, flexShrink: 0 }} />
        </div>
      ))}
    </>
  )
}

export function AchievementsShell() {
  const { user, refreshProfile } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(!user?.stats)
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
        await refreshProfile()
      } catch (error) {
        console.error('Lỗi khi tải thông tin thành tựu:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    loadData()
  }, [refreshProfile])

  // Trích xuất các chỉ số trực tiếp từ user.stats đã được Backend xử lý sẵn
  const userName = user?.name || 'Người chơi'
  const avatarUrl = user?.avatar_url || user?.avatar || '/avatar-default.svg'

  const totalGamesPlayed = user?.stats?.total_games_played ?? 0
  const totalBoardGamesPlayed = user?.stats?.total_board_games_played ?? 0
  const winRate = user?.stats?.win_rate ?? 0
  const totalWins = user?.stats?.total_wins ?? 0
  const totalLastPlaces = user?.stats?.total_last_places ?? 0

  const lastPlayedDate = user?.stats?.last_played_game?.play_date || user?.stats?.last_played_at
  const lastPlayedGameName = user?.stats?.last_played_game?.name || 'Chưa có'

  const mostPlayedGame = user?.stats?.most_played_game || null
  const mostWonGame = user?.stats?.most_won_game || null
  const mostLostGame = user?.stats?.most_lost_game || null

  const topRecordGames = user?.stats?.top_record_games || []
  const leastRecentlyPlayedGame = user?.stats?.least_recently_played_game || null

  return (
    <ProtectedScreen>
      <div className="app-shell screen-achievements">
        <div className={`achievements-screen${isStandalone ? ' has-ptr' : ''}`}>
          <Header />

          <PullToRefresh onRefresh={async () => {
            try {
              await refreshProfile()
            } catch (err) {
              console.error('Pull to refresh failed:', err)
            }
          }}>
            <div className="achievements-content">
              {/* 1. Title Banner: 👑 THÀNH TÍCH CỦA BẠN */}
              <div className="achievements-title-banner">
                <h1 className="visually-hidden">Thành tích của bạn</h1>
                <Image
                  src="/image-header-ach.png"
                  alt="Thành tích của bạn"
                  width={220}
                  height={28}
                  priority
                  className="achievements-title-image"
                  unoptimized
                />
              </div>

              {isInitializing ? (
                <AchievementsSkeleton />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* 2. User Profile Banner Card */}
                  <UserProfileCard
                    userName={userName}
                    avatarUrl={avatarUrl}
                    totalGamesPlayed={totalGamesPlayed}
                  />

                  {/* 3. 2x2 Metric Grid Cards */}
                  <MetricGrid
                    totalBoardGamesPlayed={totalBoardGamesPlayed}
                    winRate={winRate}
                    totalWins={totalWins}
                    totalLastPlaces={totalLastPlaces}
                  />

                  {/* 4. Recent Play Card */}
                  <RecentPlayCard
                    lastPlayedDate={lastPlayedDate}
                    lastPlayedGameName={lastPlayedGameName}
                  />

                  {/* 5. Highlight Game Cards */}
                  <HighlightGameCard label="GAME CHƠI NHIỀU NHẤT" game={mostPlayedGame} />
                  <HighlightGameCard label="GAME CHƠI GIỎI NHẤT" game={mostWonGame} />
                  <HighlightGameCard label="GAME CHƠI GÀ NHẤT" game={mostLostGame} />

                  {/* 6. Game lâu rồi chưa chơi */}
                  <LeastRecentGroupCard game={leastRecentlyPlayedGame} />

                  {/* 7. Danh sách game có điểm cao kỷ lục */}
                  <TopRecordsGroupCard topRecordGames={topRecordGames} />
                </motion.div>
              )}
            </div>
          </PullToRefresh>
        </div>
        <BottomNav />
      </div>
    </ProtectedScreen>
  )
}
