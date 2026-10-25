import React from 'react'
import {
  ScoreGridCheckboxCell,
  ScoreGridWinnerSelectCell,
  ScoreGridHeaderCell,
  ScoreGridInputCell,
  ScoreGridLabelCell,
  ScoreGridReadonlyCell,
  ScoreGridSpacer,
  ScoreGridTotalLabelCell,
  ScoreGridWinnerCell,
} from './ScoreGridCells'
import { Icon } from '../ui/Icon'


export function ScoreGrid({
  players,
  rows = [],
  mode = 'COLUMN_BASED',
  stickyHeader = true,
  showTotal = true,
  winningPlayerIds = new Set(),
  winnerPlayerId = '',
  onWinnerChange,
  editable = false,
  getTotal,
  getInputValue,
  onCellChange,
  onCellFocus,
  onCellBlur,
}) {
  const isTotalScoreOnly = mode === 'TOTAL_SCORE_ONLY'
  const isWinnerOnly = mode === 'WINNER_ONLY'
  const displayRows = isTotalScoreOnly
    ? (rows || []).slice(0, 1)
    : isWinnerOnly
    ? [{ id: 'winner', name: 'Winner' }]
    : (rows || [])

  return (
    <div className="score-grid-wrap score-board-scroll">
      <div
        className="score-grid score-entry-grid"
        style={{
          gridTemplateColumns: `95px 8px repeat(${players.length}, minmax(70px, 1fr)) 8px`,
          minWidth: `${104 + players.length * 70}px`,
        }}
      >
        <ScoreGridHeaderCell sticky={stickyHeader} />
        <ScoreGridSpacer />
        {players.map((player) => (
          <ScoreGridHeaderCell key={player.id} player>
            <span>{player.name}</span>
          </ScoreGridHeaderCell>
        ))}
        <ScoreGridSpacer />

        {isWinnerOnly ? (
          <React.Fragment key="winner">
            <ScoreGridLabelCell sticky={stickyHeader} winnerOnly={true}>
              Winner
            </ScoreGridLabelCell>
            <ScoreGridSpacer bordered />
            {players.map((player) => {
              const isWin =
                (Boolean(winnerPlayerId) && String(winnerPlayerId) === String(player.id)) ||
                winningPlayerIds.has(player.id) ||
                winningPlayerIds.has(String(player.id))

              return editable ? (
                <ScoreGridWinnerSelectCell
                  key={player.id}
                  checked={isWin}
                  onChange={() => onWinnerChange?.(player.id)}
                  ariaLabel={`Chọn ${player.name} là người thắng`}
                />
              ) : (
                <ScoreGridWinnerCell key={player.id} winning={isWin} winnerOnly={true}>
                  {isWin ? '' : <Icon src="/face-frown-slight.png" color="#A3988F" size={24} ariaLabel="Người thua" />}
                </ScoreGridWinnerCell>
              )
            })}
            <ScoreGridSpacer bordered />
          </React.Fragment>
        ) : (
          displayRows.map((row) => (
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
          ))
        )}

        {!isTotalScoreOnly && !isWinnerOnly && showTotal ? (
          <>
            <ScoreGridTotalLabelCell sticky={stickyHeader}>Tổng</ScoreGridTotalLabelCell>
            <ScoreGridSpacer bordered />
            {players.map((player) => (
              <ScoreGridWinnerCell
                key={player.id}
                winning={winningPlayerIds.has(player.id) || winningPlayerIds.has(String(player.id))}
              >
                {getTotal ? getTotal(player.id) : player.total}
              </ScoreGridWinnerCell>
            ))}
            <ScoreGridSpacer bordered />
          </>
        ) : null}
      </div>
    </div>
  )
}

