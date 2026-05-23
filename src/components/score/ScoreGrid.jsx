import React from 'react'

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

  return (
    <div className="score-grid-wrap score-board-scroll">
      <div
        className="score-grid score-entry-grid"
        style={{
          gridTemplateColumns: `95px 8px repeat(${players.length}, minmax(70px, 1fr)) 8px`,
          minWidth: `${104 + players.length * 70}px`,
        }}
      >
        <div className={`score-grid-header${stickyHeader ? ' score-grid-sticky score-grid-sticky-header' : ''}`} />
        <div className="grid-spacer"></div>
        {players.map((player) => (
          <div key={player.id} className="score-grid-header player-header">
            <span>{player.name}</span>
          </div>
        ))}
        <div className="grid-spacer"></div>

        {displayRows.map((row) => (
          <React.Fragment key={row.id}>
            <div className={`score-grid-label${stickyHeader ? ' score-grid-sticky' : ''}${isTotalScoreOnly ? ' total-score-only' : ''}`}>{row.name || row.id}</div>
            <div className={`grid-spacer${isTotalScoreOnly ? ' border' : ''}`}></div>
            {players.map((player) => (
              isTotalScoreOnly && !editable ? (
                <div key={player.id} className="score-grid-winner">
                  <strong className={winningPlayerIds.has(player.id) ? 'winning-total' : ''}>
                    {row.scores?.[player.id] ?? 0}
                  </strong>
                </div>
              ) : (
                <div key={player.id} className={`score-grid-cell${isTotalScoreOnly ? ' total-score-only' : ''}`}>
                  {editable ? (
                    <input
                      className={`score-box${row.type === 'text' ? ' score-box-text' : ''}`}
                      type={row.type === 'text' ? 'text' : 'number'}
                      value={getInputValue(row, player.id)}
                      onChange={(event) => onCellChange(row.id, player.id, event.target.value, row.type)}
                      onFocus={() => onCellFocus?.(`${row.id}:${player.id}`)}
                      onBlur={() => onCellBlur?.()}
                    />
                  ) : (
                    <div className={`readonly-score-box${row.type === 'text' ? ' text' : ''}`}>
                      {(() => {
                        const value = row.scores?.[player.id] ?? (row.type === 'text' ? '' : 0)
                        if (row.type !== 'text' && Number(value) === 0) return '-'
                        return value
                      })()}
                    </div>
                  )}
                </div>
              )
            ))}
            <div className={`grid-spacer${isTotalScoreOnly ? ' border' : ''}`}></div>
          </React.Fragment>
        ))}

        {!isTotalScoreOnly && showTotal ? (
          <>
            <div className={`score-grid-total${stickyHeader ? ' score-grid-sticky' : ''}`}>Tổng</div>
            <div className="grid-spacer border"></div>
            {players.map((player) => (
              <div key={player.id} className="score-grid-winner">
                <strong className={winningPlayerIds.has(player.id) ? 'winning-total' : ''}>
                  {getTotal ? getTotal(player.id) : player.total}
                </strong>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  )
}
