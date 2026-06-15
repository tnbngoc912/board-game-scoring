import React from 'react'
import clsx from 'clsx'

export function ScoreGridHeaderCell({ children, sticky = false, player = false }) {
  return (
    <div
      className={clsx(
        'score-grid-header',
        sticky && 'score-grid-sticky-top',
        sticky && !player && 'score-grid-sticky score-grid-sticky-intersection',
        player && 'player-header'
      )}
    >
      {children}
    </div>
  )
}

export function ScoreGridSpacer({ bordered = false, sticky = false, stickyBottom = false }) {
  return (
    <div
      className={clsx(
        'grid-spacer',
        bordered && 'border',
        sticky && 'score-grid-sticky-top',
        stickyBottom && 'score-grid-sticky-bottom'
      )}
    />
  )
}

export function ScoreGridLabelCell({ children, sticky = true, totalScoreOnly = false }) {
  return (
    <div className={clsx('score-grid-label', sticky && 'score-grid-sticky', totalScoreOnly && 'total-score-only')}>
      {children}
    </div>
  )
}

export function ScoreGridInputCell({
  row,
  playerId,
  totalScoreOnly = false,
  getInputValue,
  onCellChange,
  onCellFocus,
  onCellBlur,
}) {
  return (
    <div className={clsx('score-grid-cell', totalScoreOnly && 'total-score-only')}>
      <input
        className={clsx('score-box', row.type === 'text' && 'score-box-text')}
        type={row.type === 'text' ? 'text' : 'number'}
        value={getInputValue(row, playerId)}
        onChange={(event) => onCellChange(row.id, playerId, event.target.value, row.type)}
        onFocus={() => onCellFocus?.(`${row.id}:${playerId}`)}
        onBlur={() => onCellBlur?.()}
      />
    </div>
  )
}

export function ScoreGridReadonlyCell({ row, playerId, totalScoreOnly = false }) {
  const value = row.scores?.[playerId] ?? (row.type === 'text' ? '' : 0)
  const isZeroScore = row.type !== 'text' && Number(value) === 0
  const displayValue = isZeroScore ? '-' : value

  return (
    <div className={clsx('score-grid-cell', totalScoreOnly && 'total-score-only')}>
      <div className={clsx('readonly-score-box', row.type === 'text' && 'text', isZeroScore && 'zero-score')}>
        {displayValue}
      </div>
    </div>
  )
}

export function ScoreGridTotalLabelCell({ sticky = true, children = 'Tổng' }) {
  return (
    <div
      className={clsx(
        'score-grid-total',
        sticky && 'score-grid-sticky-bottom',
        sticky && 'score-grid-sticky score-grid-sticky-bottom-intersection'
      )}
    >
      {children}
    </div>
  )
}

export function ScoreGridWinnerCell({ children, winning = false, sticky = false }) {
  return (
    <div className={clsx('score-grid-winner', sticky && 'score-grid-sticky-bottom')}>
      <strong className={clsx(winning && 'winning-total')}>{children}</strong>
    </div>
  )
}
