import React from 'react'
import Image from 'next/image'

export function LeaderboardItemCard({ rank, name, avatarUrl, wins = 0 }) {
  let rankClass = 'rank-other'
  if (rank === 1) rankClass = 'rank-1'
  else if (rank === 2) rankClass = 'rank-2'
  else if (rank === 3) rankClass = 'rank-3'

  return (
    <article className="leaderboard-item-card">
      <div className="leaderboard-player-info">
        <div className={`leaderboard-rank ${rankClass}`}>
          #{rank}
        </div>
        <div className="leaderboard-avatar">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={40} height={40} />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
        <h4 className="leaderboard-name">{name}</h4>
      </div>
      <div className="leaderboard-wins-box">
        <span className="leaderboard-wins-label">Thắng</span>
        <strong className="leaderboard-wins-count">{wins}</strong>
      </div>
    </article>
  )
}
