import React from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'

export function ScoreGridHeaderCell({ children, sticky = false, player = false }) {

  return (
    <div
      className={clsx(
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
  return <div className={clsx('grid-spacer', bordered && 'border')} />
}

export function ScoreGridLabelCell({ children, sticky = true, totalScoreOnly = false, winnerOnly = false }) {
  return (
    <div className={clsx('score-grid-label', sticky && 'score-grid-sticky', (totalScoreOnly || winnerOnly) && 'total-score-only winner-only')}>
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
  return <div className={clsx('score-grid-total', sticky && 'score-grid-sticky')}>{children}</div>
}

export function ScoreGridWinnerCell({ children, winning = false, winnerOnly = false }) {
  return (
    <div className={clsx('score-grid-winner', winnerOnly && 'winner-only')}>
      {winning ? (
        <strong className={clsx('winning-total', winnerOnly && 'winner-only')}>
          <img
            src="/crown.svg"
            alt=""
            className="crown-icon-bg"
            crossOrigin="anonymous"
          />
          {children ? <span>{children}</span> : null}
        </strong>
      ) : (
        <strong>{children}</strong>
      )}
    </div>
  )
}

export function ScoreGridWinnerSelectCell({
  checked = false,
  onChange,
  disabled = false,
  ariaLabel,
}) {
  return (
    <div
      className={clsx(
        'score-grid-cell',
        'score-grid-winner-select-cell',
        'winner-only',
        checked && 'is-winner'
      )}
      onClick={!disabled ? onChange : undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onChange?.()
        }
      }}
      aria-label={ariaLabel}
      aria-pressed={checked}
    >
      <div className="winner-crown-slot">
        {checked ? (
          <motion.div
            key="crown"
            layoutId="winner-crown-active"
            className="winner-crown-wrapper"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 450,
              damping: 28,
            }}
          >
            <img
              src="/crown.svg"
              alt=""
              className="winner-crown-icon"
              crossOrigin="anonymous"
            />
          </motion.div>
        ) : (
          <div className="winner-crown-placeholder" />
        )}
      </div>
    </div>
  )
}

export function ScoreGridCheckboxCell({
  checked = false,
  onChange,
  disabled = false,
  ariaLabel,
}) {
  return (
    <label
      className={clsx('score-grid-cell', 'score-grid-checkbox-cell', 'winner-only')}
      aria-label={ariaLabel}
    >
      <input
        type="checkbox"
        className="score-grid-checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  )
}
