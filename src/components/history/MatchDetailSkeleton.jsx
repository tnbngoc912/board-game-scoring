import React from 'react'
import { Header } from '../Header'

export function MatchDetailSkeleton({ onBack }) {
  return (
    <div className="screen score-screen history-detail-screen match-detail-skeleton" aria-busy="true">
      <Header
        title="Bảng Điểm"
        onBack={onBack}
      />

      <div className="detail-content match-detail-skeleton-content">
        {/* 1. Summary Strip Skeleton */}
        <section className="match-summary-strip match-summary-strip-skeleton">
          <div className="game-card-thumb detail-thumb skeleton-box" />
          <div className="match-summary-skeleton-info">
            <span className="skeleton-box skeleton-title" />
            <span className="skeleton-box skeleton-subtitle" />
          </div>
        </section>

        {/* 2. Score Grid Skeleton */}
        <section className="score-board history-score-board match-score-skeleton-section">
          <div className="score-grid-wrap score-board-scroll">
            <div
              className="score-grid score-entry-grid match-grid-skeleton"
              style={{
                gridTemplateColumns: '95px 8px repeat(3, minmax(70px, 1fr)) 8px',
                minWidth: '320px',
              }}
            >
              {/* Header row */}
              <div className="score-cell-head score-cell-sticky">
                <span className="skeleton-box skeleton-text-short" />
              </div>
              <div className="score-col-spacer" />
              {[1, 2, 3].map((playerIndex) => (
                <div key={`head-${playerIndex}`} className="score-cell-head score-cell-head-player">
                  <span className="skeleton-box skeleton-player-name" />
                </div>
              ))}
              <div className="score-col-spacer" />

              {/* Score rows */}
              {[1, 2, 3, 4].map((rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                  <div className="score-cell-label score-cell-sticky">
                    <span className="skeleton-box skeleton-category-name" />
                  </div>
                  <div className="score-col-spacer" />
                  {[1, 2, 3].map((playerIndex) => (
                    <div key={`cell-${rowIndex}-${playerIndex}`} className="score-cell-score">
                      <span className="skeleton-box skeleton-cell-value" />
                    </div>
                  ))}
                  <div className="score-col-spacer" />
                </React.Fragment>
              ))}

              {/* Total row */}
              <div className="score-cell-total-label score-cell-sticky">
                <span className="skeleton-box skeleton-total-label" />
              </div>
              <div className="score-col-spacer score-col-spacer--bordered" />
              {[1, 2, 3].map((playerIndex) => (
                <div key={`total-${playerIndex}`} className="score-cell-winner">
                  <span className="skeleton-box skeleton-total-value" />
                </div>
              ))}
              <div className="score-col-spacer score-col-spacer--bordered" />
            </div>
          </div>
        </section>

        {/* 3. Comments Section Skeleton */}
        <section className="match-comments-section match-comments-skeleton-section" aria-label="Đang tải bình luận">
          <div className="match-comments-heading">
            <span className="skeleton-box skeleton-comments-title" />
          </div>

          <div className="match-comments-list">
            {[1, 2].map((itemIndex) => (
              <div key={`comment-${itemIndex}`} className="match-comment-item match-comment-skeleton-item">
                <div className="match-comment-avatar skeleton-box" />
                <div className="match-comment-body">
                  <div className="match-comment-details">
                    <div className="match-comment-meta">
                      <span className="skeleton-box skeleton-comment-user" />
                      <span className="skeleton-box skeleton-comment-time" />
                    </div>
                    <span className="skeleton-box skeleton-comment-text-1" />
                    <span className="skeleton-box skeleton-comment-text-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
