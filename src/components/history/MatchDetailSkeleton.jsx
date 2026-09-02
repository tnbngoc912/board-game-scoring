import React from 'react'
import { Header } from '../Header'

export function MatchDetailSkeleton({ onBack }) {
  return (
    <div className="screen score-screen history-detail-screen match-detail-skeleton" aria-busy="true">
      <Header
        title="Bảng Điểm"
        onBack={onBack}
      />

      <div className="detail-content">
        {/* 1. Summary Strip Skeleton */}
        <section className="match-summary-strip">
          <div className="game-card-thumb detail-thumb skeleton-box" />
          <div className="match-summary-skeleton-info">
            <div className="skeleton-box skeleton-title" />
            <div className="skeleton-box skeleton-subtitle" />
          </div>
        </section>

        {/* 2. Score Grid Skeleton - Cấu trúc 100% khớp với ScoreGrid thật */}
        <section className="score-board history-score-board">
          <div className="score-grid-wrap score-board-scroll">
            <div
              className="score-grid score-entry-grid"
              style={{
                gridTemplateColumns: '95px 8px repeat(3, minmax(70px, 1fr)) 8px',
                minWidth: '320px',
              }}
            >
              {/* Header row */}
              <div className="score-grid-header score-grid-sticky score-grid-sticky-header" />
              <div className="grid-spacer" />
              {[1, 2, 3].map((playerIndex) => (
                <div key={`head-${playerIndex}`} className="score-grid-header player-header">
                  <div className="skeleton-box skeleton-player-name" />
                </div>
              ))}
              <div className="grid-spacer" />

              {/* Score rows */}
              {[1, 2, 3, 4].map((rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                  <div className="score-grid-label score-grid-sticky">
                    <div className="skeleton-box skeleton-category-name" />
                  </div>
                  <div className="grid-spacer" />
                  {[1, 2, 3].map((playerIndex) => (
                    <div key={`cell-${rowIndex}-${playerIndex}`} className="score-grid-cell">
                      <div className="readonly-score-box">
                        <div className="skeleton-box skeleton-score-val" />
                      </div>
                    </div>
                  ))}
                  <div className="grid-spacer" />
                </React.Fragment>
              ))}

              {/* Total row */}
              <div className="score-grid-total score-grid-sticky">Tổng</div>
              <div className="grid-spacer border" />
              {[1, 2, 3].map((playerIndex) => (
                <div key={`total-${playerIndex}`} className="score-grid-winner">
                  <strong className="winning-total">
                    <div className="skeleton-box skeleton-total-val" />
                  </strong>
                </div>
              ))}
              <div className="grid-spacer border" />
            </div>
          </div>
        </section>

        {/* 3. Comments Section Skeleton - Khớp 100% với MatchCommentsSection thật */}
        <section className="match-comments-section" aria-label="Đang tải bình luận">
          <div className="match-comments-heading">
            <h2>Bình luận</h2>
            <div className="skeleton-box skeleton-comments-count" />
          </div>

          <div className="match-comments-list">
            {[1, 2].map((itemIndex) => (
              <article key={`comment-${itemIndex}`} className="match-comment-item">
                <div className="match-comment-avatar skeleton-box" />
                <div className="match-comment-body">
                  <div className="match-comment-details">
                    <div className="match-comment-meta">
                      <div className="skeleton-box skeleton-comment-user" />
                      <div className="skeleton-box skeleton-comment-time" />
                    </div>
                    <div className="skeleton-box skeleton-comment-line-1" />
                    <div className="skeleton-box skeleton-comment-line-2" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
