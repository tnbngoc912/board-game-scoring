import React, { useEffect, useRef } from 'react'
import {
  ScoreGridHeaderCell,
  ScoreGridInputCell,
  ScoreGridLabelCell,
  ScoreGridReadonlyCell,
  ScoreGridSpacer,
  ScoreGridTotalLabelCell,
  ScoreGridWinnerCell,
} from './ScoreGridCells'

export function ScoreGrid({
  players,
  rows,
  mode = 'COLUMN_BASED',
  stickyHeader = true,
  showTotal = true,
  winningPlayerIds = new Set(),
  editable = false,
  getTotal,
  getInputValue,
  onCellChange,
  onCellFocus,
  onCellBlur,
}) {
  const isTotalScoreOnly = mode === 'TOTAL_SCORE_ONLY'
  const displayRows = isTotalScoreOnly ? rows.slice(0, 1) : rows

  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0
    let startY = 0
    let lockedScrollTop = 0
    let lockedScrollLeft = 0
    let scrollDirection = null
    let isTouchActive = false

    const handleTouchStart = (e) => {
      if (e.touches.length > 1) return
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      lockedScrollTop = container.scrollTop
      lockedScrollLeft = container.scrollLeft
      scrollDirection = null
      isTouchActive = true
    }

    const handleTouchMove = (e) => {
      if (!isTouchActive || e.touches.length > 1) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const diffX = currentX - startX
      const diffY = currentY - startY

      if (!scrollDirection) {
        const absDiffX = Math.abs(diffX)
        const absDiffY = Math.abs(diffY)
        const threshold = 5

        if (absDiffX > threshold || absDiffY > threshold) {
          if (absDiffX > absDiffY) {
            scrollDirection = 'horizontal'
          } else {
            scrollDirection = 'vertical'
          }
        }
      }

      if (scrollDirection === 'horizontal') {
        if (e.cancelable) {
          e.preventDefault()
        }
        container.scrollLeft = lockedScrollLeft - diffX
      } else if (scrollDirection === 'vertical') {
        container.scrollLeft = lockedScrollLeft
      }
    }

    const handleTouchEnd = () => {
      isTouchActive = false
      scrollDirection = null
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [])

  return (
    <div ref={containerRef} className="score-grid-wrap score-board-scroll">
      <div
        className="score-grid score-entry-grid"
        style={{
          gridTemplateColumns: `95px 8px repeat(${players.length}, minmax(70px, 1fr)) 8px`,
          minWidth: `${104 + players.length * 70}px`,
        }}
      >
        <ScoreGridHeaderCell sticky={stickyHeader} />
        <ScoreGridSpacer sticky={stickyHeader} />
        {players.map((player) => (
          <ScoreGridHeaderCell key={player.id} player sticky={stickyHeader}>
            <span>{player.name}</span>
          </ScoreGridHeaderCell>
        ))}
        <ScoreGridSpacer sticky={stickyHeader} />

        {displayRows.map((row) => (
          <React.Fragment key={row.id}>
            <ScoreGridLabelCell sticky={stickyHeader} totalScoreOnly={isTotalScoreOnly}>
              {row.name || row.id}
            </ScoreGridLabelCell>
            <ScoreGridSpacer bordered={isTotalScoreOnly} />
            {players.map((player) => (
              isTotalScoreOnly && !editable ? (
                <ScoreGridWinnerCell key={player.id} winning={winningPlayerIds.has(player.id)}>
                  {row.scores?.[player.id] ?? 0}
                </ScoreGridWinnerCell>
              ) : (
                editable ? (
                  <ScoreGridInputCell
                    key={player.id}
                    row={row}
                    playerId={player.id}
                    totalScoreOnly={isTotalScoreOnly}
                    getInputValue={getInputValue}
                    onCellChange={onCellChange}
                    onCellFocus={onCellFocus}
                    onCellBlur={onCellBlur}
                  />
                ) : (
                  <ScoreGridReadonlyCell
                    key={player.id}
                    row={row}
                    playerId={player.id}
                    totalScoreOnly={isTotalScoreOnly}
                  />
                )
              )
            ))}
            <ScoreGridSpacer bordered={isTotalScoreOnly} />
          </React.Fragment>
        ))}

        {!isTotalScoreOnly && showTotal ? (
          <>
            <ScoreGridTotalLabelCell sticky={stickyHeader}>Tổng</ScoreGridTotalLabelCell>
            <ScoreGridSpacer bordered stickyBottom={stickyHeader} />
            {players.map((player) => (
              <ScoreGridWinnerCell key={player.id} winning={winningPlayerIds.has(player.id)} sticky={stickyHeader}>
                {getTotal ? getTotal(player.id) : player.total}
              </ScoreGridWinnerCell>
            ))}
          </>
        ) : null}
      </div>
    </div>
  )
}
