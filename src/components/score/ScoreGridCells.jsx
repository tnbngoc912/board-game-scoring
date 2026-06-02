import React from 'react'

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

export function ScoreGridHeaderCell({ children, sticky = false, player = false }) {
  return (
    <div
      className={joinClassNames(
        'score-grid-header',
        sticky && 'score-grid-sticky score-grid-sticky-header',
        player && 'player-header'
      )}
    >
      {children}
    </div>
  )
}

export function ScoreGridSpacer({ bordered = false }) {
  return <div className={joinClassNames('grid-spacer', bordered && 'border')} />
}

export function ScoreGridLabelCell({ children, sticky = true, totalScoreOnly = false }) {
  return (
    <div className={joinClassNames('score-grid-label', sticky && 'score-grid-sticky', totalScoreOnly && 'total-score-only')}>
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
    <div className={joinClassNames('score-grid-cell', totalScoreOnly && 'total-score-only')}>
      <input
        className={joinClassNames('score-box', row.type === 'text' && 'score-box-text')}
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
  const displayValue = row.type !== 'text' && Number(value) === 0 ? '-' : value

  return (
    <div className={joinClassNames('score-grid-cell', totalScoreOnly && 'total-score-only')}>
      <div className={joinClassNames('readonly-score-box', row.type === 'text' && 'text')}>
        {displayValue}
      </div>
    </div>
  )
}

export function ScoreGridTotalLabelCell({ sticky = true, children = 'Tổng' }) {
  return <div className={joinClassNames('score-grid-total', sticky && 'score-grid-sticky')}>{children}</div>
}

export function ScoreGridWinnerCell({ children, winning = false }) {
  return (
    <div className="score-grid-winner">
      <strong className={winning ? 'winning-total' : ''}>{children}</strong>
    </div>
  )
}
